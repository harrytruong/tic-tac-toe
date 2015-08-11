/**
 * Grid - Backbone.Model for current game state.
 *
 * Harry Truong <harry@asdfjkltech.com>
 */

import _ from 'lodash';
import Backbone from 'backbone';

// Generic helpers
const everyEq = (match, data) =>
        _.every(data, _.partial(_.eq, match)),
    // ex: everyEq(null, [null, null])      ==> true
    // ex: everyEq(null, [1, null])         ==> false

    findPick = (data, picks, predicate) =>
        _.find(picks, (pick) => predicate(_.pick(data, pick))),
    // ex: findPick(
    //     [null, 1, 2],
    //     [[0], [0, 1], [1, 2]],
    //     (v) => _.includes(v, 2))         ==> [1, 2]

    findPickEveryEq = (match, data, picks) =>
        findPick(data, picks, _.partial(everyEq, match));
    // ex: findPickEveryEq(
    //     1,
    //     [1, 2, 3, 2, 1],
    //     [[0, 1], [2], [2, 3], [0, 4]])   ==> [0, 4]

// Grid Solutions helper
const solveGrid = (size) => {
    const S = size,
        L = size * size,
        solutions = [];
    
    for (let i = 0; i < S; i++) {

        // check row-by-row for winner
        solutions.push(_.range(i * S, (i * S) + S));

        // check col-by-col for winner
        solutions.push(_.range(i, L, S));

        // check TL-BR-diag for winner
        if (i <= (S - 3)) {
            solutions.push(_.range(i, (S - i) * S, S + 1));
        }

        // check TR-BL-diag for winner
        if (i >= 2) {
            solutions.push(_.range(i, S * i + 1, S - 1));
        }

        // check extra lower-half diagonals
        if (S > 3) {

            // check BR-TL-diag for winner
            if (i >= 1 && i <= (S - 3)) {
                solutions.push(_.range(L - 1 - i, (S * i) - 1, -(S + 1)));
            }

            // check BL-TR-diag for winner
            if (i >= 2 && i <= (S - 2)) {
                solutions.push(_.range(L - 1 - i, (S - i - 1) * S, -(S - 1)));
            }
        }
    }
    
    // sort solutions' positions in asc order
    _.invoke(solutions, 'sort', (a, b) => a > b);
    
    return solutions;
}

class Grid extends Backbone.Model {

    defaults() { return {
        size            : 3,        // 3x3 grid
        solutions       : [],       // grid solutions
        solutionsMap    : [],       // solutions, mapped by position
        data            : [],       // grid position marks
        history         : [],       // history of grid marks
        
        status          : false,    // see `status()` method
        
        turn            : 0,        // 0 or 1 to represent current turn
        startTurn       : 0,        // 0 or 1 to represent starting turn
        marks           : ['x','o'] // marks to use
    }; }
    
    // extend "get" to _.cloneDeep() Array attributes
    // and extra handler for "turnMark" attribute
    get(attr){
        if (attr == 'turnMark'){
            return super.get('marks')[super.get('turn')];
        }
        else if (attr == 'lastMark'){
            return super.get('marks')[super.get('turn')]
        }
        
        const val = super.get(attr);
        return (val instanceof Array) ? _.cloneDeep(val) : val;
    }
    
    initialize() {
        this.on('change:size', this.solve)
            .on('change:size', this.reset);
            
        return this.solve().reset();
    }
    
    // reset grid attributes
    reset() {
        return this.resetData()
                   .resetHistory()
                   .resetTurn()
                   .set('status', false)
                   .trigger("reset", this);
    }
    
    // set "data" to null array
    resetData() {
        const size = this.get("size");
        return this.set("data", _.range(size * size).map(() => null));
    }
    
    // set "history" to empty array
    resetHistory() {
        return this.set("history", []);
    }
    
    // set "turn" to "startTurn"
    resetTurn(){
        return this.set("turn", this.get("startTurn"));
    }
    
    // set "solutions" and "solutionsMap"
    solve() {
        const size = this.get("size"),
            solutions = solveGrid(size),
            
            // generate map of solutions based on position
            // note: we use solution's array idx as a form of "id"
            solutionsMap = _.reduce(solutions, (map, solution, id) => {
                for (let pos of solution) {
                    if (! map[pos]) map[pos] = [];
                    map[pos].push(id);
                }
                return map;
            }, []);
        
        // ex: solutions for 4x4 grid
        // solutions = [
        //     [0, 1, 2, 3],
        //     [0, 4, 8, 12],
        //     [0, 5, 10, 15],
        //     [4, 5, 6, 7],
        //     [1, 5, 9, 13],
        //     [1, 6, 11],
        //     [4, 9, 14],
        //     [8, 9, 10, 11],
        //     [2, 6, 10, 14],
        //     [2, 5, 8],
        //     [7, 10, 13],
        //     [12, 13, 14, 15],
        //     [3, 7, 11, 15],
        //     [3, 6, 9, 12]
        // ];
        
        // ex: solutionsMap for 4x4 grid
        // solutionsMap = [
        //     [0, 1, 2],
        //     [0, 4, 5],
        //     [0, 8, 9],
        //     [0, 12, 13],
        //     [1, 3, 6],
        //     [2, 3, 4, 9],
        //     [3, 5, 8, 13],
        //     [3, 10, 12],
        //     [1, 7, 9],
        //     [4, 6, 7, 13],
        //     [2, 7, 8, 10],
        //     [5, 7, 12],
        //     [1, 11, 13],
        //     [4, 10, 11],
        //     [6, 8, 11],
        //     [2, 11, 12]
        // ]
        
        // ex: for 4x4 grid, the 5th position (solutionsMap[5])
        //     is part of solutions [2, 3, 4, 9].
        //
        //        solution[2] = [0, 5, 10, 15]
        //        solution[3] = [4, 5, 6, 7]
        //        solution[4] = [1, 5, 9, 13]
        //        solution[9] = [2, 5, 8]
        
        return this.set({
            solutions: solutions,
            solutionsMap: solutionsMap
        });
    }
    
    // add new mark
    mark(position, mark) {
        position = parseInt(position);
        const data = this.get("data"),
            history = this.get("history"),
            turn = this.get('turn');
        
        // grid status check
        if (this.get('status')) {
            throw "Can't add new marks to solved grid."
        }
        
        // input sanity check
        if (! (data.propertyIsEnumerable(position) &&
               data[position] === null)) {
            throw `Invalid position "${position}" for grid.mark().`;
        }
        
        // mark position in data
        data[position] = mark;
        history.push({mark: mark, position: position});
        
        // update attributes
        const status = this.set({
            data: data,
            history: history,
            turn: (turn+1) & 1
        }).status(); // get grid status
        
        // if gameover, flip the starting turn
        if (status) this.set('startTurn', (this.get('startTurn')+1)&1);
        
        // trigger "mark" event
        return this.trigger('mark', this, status, position, mark);
    }
    
    status(){
        
        // return Array with winning solution set,
        //      or TRUE (indicating tie game),
        //      or FALSE (indicating game can continue)
        
        // status relies on at least one move made
        const last = _.last(this.get('history'));
        if (! last) return false;
        
        const data = this.get("data"),
        
            // determine if possible to continue game
            // (i.e., can still add marks)
            gameover = (! _.includes(data, null)),
            
            // determine last position's solutions
            solutions = _.pick(this.get("solutions"),
                               this.get("solutionsMap")[last.position]),
            
            // check if solved, based on last position's solutions
            solved = findPickEveryEq(last.mark, data, solutions),
        
            // determine final status
            status =  solved ? solved : gameover;
        
        this.set('status', status);
        return status;
    }
    
    turn(){
        
    }
}

export default Grid;
