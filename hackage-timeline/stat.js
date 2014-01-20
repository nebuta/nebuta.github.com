//stat.js

var width = 800;
var height = 800;

var num_stats = 5;

var svg1;

var stat_kind = [];
stat_kind[0] = {name: "First Upload Data", numBin: 20, hist: function(d){}, range: function(i){}};

var currentMode;

var points;

function change(mode){
	currentMode = mode;
	switch(currentMode){
		case "01":
			points = d3.select('#svg_1').selectAll('circle')
				.data(stat)
				.enter()
				.append('circle')
				.attr('cx',function(d){return (d.firstDate - new Date("2006-01-01"))/(1000*60*60*24*365*8)*width;})
				.attr('cy',function(d){
					//console.log(d.frequency,d.updates);
					return d.updates <=1 ? (height*2) : height*(1-Math.min(1,d.frequency/50));
				})
				.attr('r',1)
				.style('fill','blue');
			break;
		default:
			points
				.exit()
				.remove('circle');
			break;
	}
}

function init(){
    initialized = true;

    selected = _.map(data,function(d){
		var vers = _.map(d[1],function(v){
			return [v[0],new Date(v[1]),v[2]];
		});
		return [d[0],vers];
	});

    var current = new Date();
	stat = _.map(selected,function(p){
		var d = {name: p[0],updates:p[1].length,modules: 0+p[1][p[1].length-1][2],
				firstDate: p[1][0][1]};
		d.interval = (p[1][p[1].length-1][1]-p[1][0][1])/d.updates/(1000*60*60*24);
		d.frequency = 1 / d.interval * 365
		return d;
	});

//	console.log(stat);
	svg1 = d3.select("#canvas").append("svg")
		.attr("width",width)
		.attr("height",height)
		.attr("id",'svg_1')
		.style("border","1px solid black")
		.style("background","#fff");

	d3.selectAll('select').on('change',function(){
		var xax = document.getElementById('xaxis');
		var yax = document.getElementById('xaxis');
		var x = xax[xax.selectedIndex].value;
		var y = yax[yax.selectedIndex].value;
		change(''+x+y);
	});

}

init();
change("01");
