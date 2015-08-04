/**
 * Grid - manages current game state.
 *
 * Harry Truong <harry@asdfjkltech.com>
 */

import _ from 'underscore';
window._ = _;

class Grid {

    constructor(size) {
        let S = this.size = size || 3; // default to size 3

        this.reset(); // initialize empty (null) values

        // cache all possible solutions
        let solved = this.solve(S);
        this.solutions = solved.solutions;
        this.positionMap = solved.positionMap;

        // _.map(this.solutions, function(s){ console.log(s); });
        // _.map(this.positionMap, function(solutions, position){
        //   console.log('Position: ' + position);
        //   console.log(solutions);
        // });

        this.history = []; // past marks
    }
    
    // get data(){ return _.clone(this.data); }
    // set data(data){ throw 'grid.data cannot be changed.' }
    // set size(size){ throw 'grid.size cannot be changed.' }
    // get solutions(){ return JSON.parse(JSON.stringify(this.solutions)); }
    // set solutions(sol){ throw 'grid.solutions cannot be changed.' }
    // get positionMap(){ return JSON.parse(JSON.stringify(this.positionMap)); }
    // set positionMap(posMap){ throw 'grid.positionMap cannot be changed.' }
    // set history(history){ throw 'grid.history cannot be changed.' }
    
    // helper to reset grid data
    reset() {
        this.data = _.range(this.size * this.size).map(() => null);
    }
    
    // helper to generate all solutions
    solve(size) {
        let S = size,
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
        
        // sort solutions' positions by asc order
        solutions = _.map(solutions, (s) => _.sortBy(s));
        
        // generate map of solutions based on position
        // note: we use solution's array idx as a form of "id"
        let positionMap = _.range(L).map(() => []);
        solutions.forEach((solution, id) => {
            for (let pos of solution) positionMap[pos].push(id);
        });
        
        // return solutions and map by positions
        return {
            solutions: solutions,
            positionMap: positionMap
        };
    }
    
    // add new mark
    mark(position, mark) {
        let data = this.data,
            solutions = this.solutions,
            positionMap = this.positionMap,
            history = this.history;
        
        // input sanity check
        if (typeof position != 'number' ||
            position < 0 ||
            position >= data.length ||
            data[position] !== null) {
            throw 'Invalid position for grid.mark().';
        }
        
        // mark position in data
        data[position] = mark;
        history.push({mark: mark, position: position});
        
        // check for winning move
        for (let id of positionMap[position]){
            let solution = solutions[id];
            
            // confirm every solution position in data,
            // matches the mark value
            if (_.every(_.pick(data, solution), (v) => (v === mark))){
                return solution; // return the winning solution set
            }
        }
        
        // indicate no winning move
        return ! _.countBy(data)[null];
    }
    
    ascii(title){
        let size = this.size,
            data = this.data,
            output = title + '\n';
            
        for (let r = 0; r < size; r++){
            if (r > 0) output += (new Array(size + size)).join('-') + '\n';
            output +=
                data.slice(r * size, (r * size) + size)
                    .map((m) => (m || ' '))
                    .join('|') + '\n';
        }
        
        return output;
    }
}

export default Grid;
