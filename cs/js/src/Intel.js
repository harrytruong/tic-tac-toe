/**
 * Intel - Manages knowledge and move predictions.
 *
 * Harry Truong <harry@asdfjkltech.com>
 */
 
import _ from 'underscore';
import Grid from './Grid';

class Intel {
    
    constructor(grid, goodMark, badMark, knowledge = []){
        if (! (grid instanceof Grid)) throw 'Intel requires Grid';
        this.grid = grid;
        
        this.goodMark = goodMark;
        this.badMark = badMark;
        this.knowledge = knowledge;
    }
    
    // helper to add new solution to knowledge
    // (can be an array of solutions)
    learn(solutions){
        let knowledge = this.knowledge;
        if (! (solutions[0] instanceof Array)) solutions = [solutions];
        
        // add solution only if not present in knowledge
        for (let solution of solutions){
            if (! (_.find(knowledge, (s) => (_.isEqual(s, solution))))) {
                knowledge.push(solution);
            }
        }
    }

    // helper to predict best move,
    // given limited knowledge of solutions
    think() {
        let data = this.grid.data,
            goodMark = this.goodMark,
            badMark = this.badMark,
            knowledge  = this.knowledge;
        
        // sort knowledge into:
        //      "offense" - possible winning solution
        //      "defense" - solution to-be defended
        //      "neutral" - all other solutions
        let plans = {offense: [], defense: [], neutral: []};
        for (let solution of knowledge){
            let state = _.pick(data, solution),
                count = _.countBy(state),
                type;
            
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
                solution: solution,
                state: state,
                count: count
            });
        }
        
        // overall intelligence weight,
        // based on positions length
        let weight = data.length,
        
            // find all available ("null") positions
            moves = _.reduce(data, (moves, mark, pos) => {
                if (mark === null) moves[pos] = -1 * weight;
                return moves;
            }, {});
        
        // rank moves based on plans
        for (let type in plans){
            
            // general move value, based on plan
            var planValue = (type == 'defense' ? 3 :
                            (type == 'offense' ? 2 : 1))
                            * weight;
            
            for (let plan of plans[type]){
                
                // specific move value, based on moves left
                // i.e., place priority on plans with fewer moves
                var moveValue = -1 * plan.count[null];
                
                _.each(plan.state, (mark, pos) => {
                    if (mark === null) moves[pos] += planValue + moveValue;
                });
            }
        }
        
        // determine highest ranked move
        // (may be multiple best-rank positions)
        let move = _.reduce(moves, (move, rank, pos) => {
            if (rank > move.rank) move = {rank: rank, pos: [pos]};
            else if (rank == move.rank) move.pos.push(pos);
            return move;
        }, {rank: -1 * weight, pos: []});
        
        // randomly choose best-ranked position
        return parseInt(_.sample(move.pos));
    }
    
}

export default Intel;
