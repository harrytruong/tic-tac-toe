/**
 * GameView - Backbone.View to contain tic-tac-toe game.
 *
 * Harry Truong <harry@asdfjkltech.com>
 */

import _ from 'lodash';
import Backbone from 'backbone';
import Grid from 'src/models/Grid';
import Intel from 'src/models/Intel';

import ust from './GameView.ust!';


const markA = '&times;', markB = '&empty;';

class GameView extends Backbone.View {
    
    initialize(){
        ust.mixin(this);
        
        const grid = this.grid = new Grid({
            marks: [markA, markB]
        });
        this.listenTo(grid, 'mark reset', () => {
            this.renderGrid().renderGridInfo();
        });
        // grid.on('all', function(){ console.log(arguments)});
        
        // game AI(s)
        this.setMode(1);
        
        this.render();
    }
    
    setMode(AIs){
        const grid = this.grid;
        if (this.ai) _.invoke(this.ai, 'destroy');
        
        switch(AIs){
            case 2:
                this.ai = [
                    new Intel({
                        grid: grid,
                        goodMark: markA,
                        badMark: markB
                    }),
                    new Intel({
                        grid: grid,
                        goodMark: markB,
                        badMark: markA
                    })
                ];
                break;
            case 1:
                this.ai = [
                    new Intel({
                        grid: grid,
                        goodMark: markB,
                        badMark: markA
                    })
                ];
                break;
            default:
                this.ai = [];
        }
        
        // have AIs automatically play
        _.invoke(this.ai, 'autoPlay');
        _.invoke(this.ai, 'on', 'change:knowledge', () => {
            this.renderAI();
        });
    }
    
    render(){
        this.$el.empty();
        this.renderGrid()
            .renderControls()
            .renderAI()
            .$el.appendTo('body');
    }
    
    renderGrid(){
        const grid = this.grid,
            data = grid.get('data'),
            $grid = this.$('.grid'),
            status = grid.get('status');
            
        if (! ($grid && $grid.length)) {
            $('<div class="grid" />')
                .html(this.ust('grid'))
                .appendTo(this.$el);
        }
        
        data.forEach((mark, pos) => {
            this.$('.position-'+pos).css('color','#000').html(mark);
        });
        
        if (status instanceof Array){
            this.$(status.map((p)=>'.position-'+p).join(', '))
                .css('color','red');
        }
        
        return this;
    }
    
    renderGridInfo(){
        const grid = this.grid,
            turnMark = grid.get('turnMark'),
            otherMark = turnMark === markA ? markB : markA,
            status = grid.get('status');
            
        this.$('.grid-info').html(
            status === false ?
                `${turnMark}'s turn to mark.` :
                (status instanceof Array ?
                    `${otherMark} has won the game.` :
                    'The game ended in a tie.'));
        
        return this;
    }
    
    renderControls(){
        const $controls = this.$('.controls');
        if (! ($controls && $controls.length)) {
            $('<div class="controls" />')
                .html(this.ust('controls'))
                .appendTo(this.$el);
        }
        
        else $controls.html(this.ust('controls'));
        
        return this;
    }
    
    renderAI(){
        const $ai = this.$('.ai');
        if (! ($ai && $ai.length)) {
            $('<div class="ai" />')
                .html(this.ust('ai'))
                .appendTo(this.$el);
        }
        
        else $ai.html(this.ust('ai'));
        
        return this;
    }
    
    events(){ return {
        'click .position'   : 'clickPosition',
        'click .grid-reset' : 'clickRestart',
        'click .grid-update' : 'clickUpdate'
    }; }
    
    clickPosition(ev){
        const $pos = this.$(ev.currentTarget),
            position = $pos.data('position'),
            grid = this.grid,
            status = grid.get('status'),
            turnMark = grid.get('turnMark');
        
        if (status == false){
            if (this.ai.length == 0){
                grid.mark(position, turnMark);
            }
            else if (this.ai.length == 1 &&
                     turnMark === markA){
                grid.mark(position, markA);
            }
        }
    }
    
    clickRestart(ev){
        ev.preventDefault();
        this.grid.reset();
    }
    
    clickUpdate(ev){
        ev.preventDefault();
        const $size = this.$('input[name="grid-size"]'),
            $ai = this.$('input[name="grid-ai"]:checked'),
            size = parseInt($size.val()) || 3,
            aiMode = parseInt($ai.val());
            
        this.setMode(aiMode);
                
        this.grid.set({
            size: size
        }).reset();
        
        this.render();
    }
}

export default GameView;
