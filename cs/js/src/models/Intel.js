/**
 * Intel - Manages knowledge and move predictions.
 *
 * Harry Truong <harry@asdfjkltech.com>
 */
 
import _ from 'lodash';
import Backbone from 'backbone';
import Grid from './Grid';

// Generic helpers
const anyEq = (needle, haystack) =>
        _.any(haystack, _.partial(_.eq, needle));
    // ex: anyEq(1, [1, 2])         ==> true
    // ex: anyEq(null, [1, 2])      ==> false

class Intel extends Backbone.Model {
    
    defaults() { return {
        grid            : new Grid(), // Grid instance
        goodMark        : 'x',        // protagonist's mark
        badMark         : 'o',        // antagonist's mark
        knowledge       : [],         // known grid solutions
    }; }
    
    // extend "get" to _.cloneDeep() Array attributes
    get(attr){
        const val = super.get(attr);
        return (val instanceof Array) ? _.cloneDeep(val) : val;
    }
    
    initialize() {
        this.listenTo(this.get('grid'), 'change:size', this.resetKnowledge);
        this.on('change:goodMark change:badMark', this.resetKnowledge);
        
        return this.resetKnowledge();
    }
    
    // set "knowledge" to empty array
    resetKnowledge() {
        return this.set('knowledge', []);
    }
    
    // add new solution(s) to knowledge
    learn(solutions){
        if (! (solutions[0] instanceof Array)) solutions = [solutions];
        const knowledge = this.get('knowledge');
        
        // if solution not present in knowledge, add it
        for (let solution of solutions) {
            if (! anyEq(solution, knowledge)) knowledge.push(solution);
        }
        
        return this.set('knowledge', knowledge);
    }

    // predict best move, based on known solutions
    think() {
        const data = this.get('grid').get('data'),
        
            // available game plans, based on knowledge and grid
            plans = this.plans(),
            
            // overall intelligence weight, based on positions length
            size = this.get('grid').get('size'),
            
            // start ranking all possible moves ("null" positions)
            moveRanks = _.reduce(data, (moveRanks, mark, pos) => {
                if (mark === null) moveRanks[pos] = 0;
                return moveRanks;
            }, {});
        
        // adjust move ranks, based on plans
        for (let type in plans){
            
            // adjust value based on plan type
            let planValue = (type == 'defense' ? 2/size :
                            (type == 'offense' ? 1/size : 0));
            
            for (let plan of plans[type]){
                
                // win immediately, if offensive plan has one remaining move
                if (type == 'offense' &&
                    plan.count[null] === 1) {
                    
                    // plan.state = {
                    //     '0': null
                    //     '1': 'o'
                    //     '2': 'o'
                    // }
                    
                    return parseInt(_.reduce(plan.state, (key, value, index) => {
                        if (key) return key;
                        if (value === null) return index;
                    }, null));
                }
                
                // adjust value based on moves left
                // i.e., place priority on plans with fewer remaining moves
                let moveValue = Math.pow(size, size - plan.count[null]);
                
                // example the current state for this plan
                for (let pos in plan.state){
                    
                    // ignore positions that are unavailable
                    if (plan.state[pos] !== null) continue;
                    
                    // adjust the move's rank
                    moveRanks[pos] += planValue + moveValue;
                }
            }
        }
        
        // determine highest ranked move(s)
        let bestMove = _.reduce(moveRanks, (bestMove, rank, pos) => {
            if (rank > bestMove.rank) {
                bestMove = {
                    rank: rank,
                    positions: [pos]
                };
            }
            
            else if (rank == bestMove.rank) {
                bestMove.positions.push(pos);
            }
            
            return bestMove;
        }, {
            rank: 0,
            positions: []
        });
        
        // randomly choose best-ranked position
        return parseInt(_.sample(bestMove.positions));
    }
    
    // helper to group known solutions ("knowledge")
    // into plans ("offsense", "defense" or "neutral"),
    // based on current grid data
    plans(){
        const data = this.get('grid').get('data'),
            goodMark = this.get('goodMark'),
            badMark = this.get('badMark'),
            knowledge  = this.get('knowledge'),
            plans = {offense: [], defense: [], neutral: []};
        
        //  "offense" - possible winning solution
        //  "defense" - solution to be defended against
        //  "neutral" - all other solutions
        for (let solution of knowledge){
            let state = _.pick(data, solution),
                count = _.countBy(state),
                type = false;
            
            // skip solutions where no moves left
            if (! count[null]) continue;
            
            // offensive = only "goodMark" and no "badMark"
            else if (count[goodMark] && (! count[badMark])) {
                type = 'offense';
            }
            
            // defensive = only "badMark" and no "goodMark"
            else if (count[badMark] && (! count[goodMark])) {
                type = 'defense';
            }
            
            // neutral = neither "goodMark" nor "badMark"
            else if ((! count[badMark]) && (! count[goodMark])) {
                type = 'neutral';
            }
            
            // ignore un-usable solutions
            // i.e., solutions with mix of goodMarks and badMarks
            else continue;
            
            // save solution to plan
            plans[type].push({
                state: state,
                count: count
            });
        }
        
        return plans;
    }
    
    // attach event listeners to auto-play grid
    autoPlay(){
        const grid = this.get('grid'),
            goodMark = this.get('goodMark'),
            badMark = this.get('badMark');
        
        this.listenTo(grid, 'mark reset', function(){
            const status = grid.get('status'),
                turnMark = grid.get('turnMark');
            if (status instanceof Array) this.learn(status);
            if (status === false && turnMark === goodMark) {
                setTimeout(() => {
                    grid.mark(this.think(), goodMark);
                }, 1000);
            }
        });
    }
}

export default Intel;
