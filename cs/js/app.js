/**
 * Application Bootstrap
 *
 * Harry Truong <harry@asdfjkltech.com>
 */
 
import GameView from 'src/views/GameView'
import $ from 'jquery';

$(() => {
    const game = new GameView();
    window.game = game;
});

/*
window.Turn = function(move){
    let m;
    if (typeof move === 'number') m = grid.mark(move, 'x');
    if (! m) m = grid.mark(intelO.think(), 'o');
    
    console.log(grid.ascii(''));
    
    if (m) {
        console.log(m);
        if (m instanceof Array) {
            console.log('intelO learned: '+ JSON.stringify(m));
            intelO.learn(m);
        }
        else {
            console.log('tied, learned nothing');
        }
        
        grid.reset();
        console.log('game reset');
        console.log(grid.ascii());
    }
}
window.grid = grid;
window.intelO = intelO;

/*
let intelligent = grid.solutions.length;
while (intelX.knowledge.length !== intelligent &&
       intelO.knowledge.length !== intelligent){
    let solution = false,
        turn = 'x';
    
    while (! solution){
        
        // determine move, and mark
        let move = (turn == 'x' ? intelX : intelO).think();
        solution = grid.mark(move, turn);
        
        // output status
        grid.ascii(
            solution === true ?
                `${turn} ties with ${move}` :
                (solution instanceof Array ?
                    `${turn} wins with ${move}` :
                    `${turn} marks ${move}`));
        
        // flip turn
        turn = turn == 'x' ? 'o' : 'x';
    }
    
    if (solution instanceof Array){
        intelX.learn(solution);
        intelO.learn(solution);
    }
    
    document.body.appendChild(document.createElement('hr')); // break output
    grid.reset(); // reset data
}

*/
