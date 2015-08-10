/**
 * GameView - Backbone.View to contain tic-tac-toe game.
 *
 * Harry Truong <harry@asdfjkltech.com>
 */

import Backbone from 'backbone';
import Grid from 'src/models/Grid';
import Intel from 'src/models/Intel';

import Template from './GameView.ust!';
console.log(Template);

class GameView extends Backbone.View {
    
    initialize(){
        this.grid = new Grid();
        this.render();
    }
    
    render(){
        this.$el.html(Template.ust('bar')).appendTo('body');
        console.log(this.$el);
        console.log($('body'));
        console.log(this.$el.html());
    }
}

export default GameView;
