var log = function(d) {console.log(d)};

function scaled_color(v,min,max) {
	var str = "hsl("+(1-(Math.max(Math.min(max,v),0))/(max-min))*240+",100%,50%)";
	return str;
}

var width = 800;
var height = 800;
var pixelSize = 1.5

var animation = false;

var margin_top = 50;
var margin_left = 20;
var height2 = height - margin_top*2;
var width2 = width - margin_left*2;

var svg1;

var selected = [];
var order = [];

var byFirstUpload = 0;
var byNumVersions = 1;
order[byFirstUpload] = _.range(0,data.length);
order[byNumVersions] = [];
order[2] = [];
var currentMode = byFirstUpload;

var initialized = false;

//For order 1
var maxVersionSize = 200;
var bucketSize = _.map(_.range(0,maxVersionSize),function(i){return 0;});
var bucketPos = _.map(_.range(0,maxVersionSize),function(i){return 0;});
var bucketCount = _.map(_.range(0,maxVersionSize),function(i){return 0;});

//For order 2
var maxPackageSize = 200;
var bucketSize2 = _.map(_.range(0,maxPackageSize),function(i){return 0;});
var bucketPos2 = _.map(_.range(0,maxPackageSize),function(i){return 0;});
var bucketCount2 = _.map(_.range(0,maxPackageSize),function(i){return 0;});

function calcOrder(){
	//Orders 1 and 2 are calculated by bucket sort.

	//Order 1: By the number of versions.
	_.each(selected,function(d){
		bucketSize[d[1].length] += 1;
	});
	//Get pos from a bucket with the largest number of versions.
	_.each(_.range(1,maxVersionSize),function(i){
		bucketPos[i] = bucketPos[i-1] + bucketSize[i-1];
	});
	_.each(_.range(0,selected.length),function(i){
		var size = selected[i][1].length;
		order[byNumVersions][i] = bucketPos[size]+bucketCount[size];
		bucketCount[size] += 1;
	});

	//Order 2: By the number of exposed modules.
	_.each(selected,function(d){
		bucketSize2[d[1][d[1].length-1][2]] += 1;
	});
	//Get pos from a bucket with the smallest number of versions.
	_.each(_.range(1,maxPackageSize),function(i){
		bucketPos2[i] = bucketPos2[i-1] + bucketSize2[i-1];
	});
	_.each(_.range(0,selected.length),function(i){
		var vers = selected[i][1];
		var size = vers[vers.length-1][2];
		order[2][i] = bucketPos2[size]+bucketCount2[size];
		bucketCount2[size] += 1;
	});
}

function changeModeOld(mode){
	if(!initialized){
		init();
	}
	currentMode = mode;
	var rows = svg1.selectAll('g');
	var len = selected.length;
	var p2 = animation ? rows.transition().duration(3000) : rows;
	p2.attr('transform',function(d,i){
			var pos = (this.getAttribute('order'+mode) || selected.length-1);
			var y = pos/len*height2+margin_top;
			return 'translate(0,'+y+')';
		});
}

function changeMode(mode){
	if(mode==-1){
		return;
	}
	if(!initialized){
		init();
	}
	currentMode = mode;
	if(animation){
		if(mode==0){
			var len = selected.length;
			var ys = _.range(firstYear,firstYear+numYears);
			_.each(ys,function(year){
				var rows = svg1.selectAll('g[data-first-year="'+year+'"]')
				var duration = 300;
				rows.transition().duration(duration).attr('transform',function(d,i){
					var pos = (this.getAttribute('order'+mode) || selected.length-1);
					var y = pos/len*height2+margin_top;
					return 'translate(0,'+y+')';
				}).delay(duration*(year-firstYear));
			});
		}else if(mode==1){
			var len = selected.length;
			count = 0;
			_.each(_.range(0,200),function(i){
				var rows = svg1.selectAll('g[data-update-count="'+i+'"]');
				if(rows.length>0){
					var duration = 500;
					rows.transition().duration(duration).attr('transform',function(d,i){
						var pos = (this.getAttribute('order'+mode) || selected.length-1);
						var y = pos/len*height2+margin_top;
						return 'translate(0,'+y+')';
					}).delay(300*count);
					count += 1;
				}
			});
		}else if(mode==2){
			var len = selected.length;
			_.each(_.range(0,200),function(count){
				var rows = svg1.selectAll('g[data-modules="'+count+'"]');
				var duration = 500;
				rows.transition().duration(duration).attr('transform',function(d,i){
					var pos = (this.getAttribute('order'+mode) || selected.length-1);
					var y = pos/len*height2+margin_top;
					return 'translate(0,'+y+')';
				}).delay(300*count);
			});
		}
	}else{
		var rows = svg1.selectAll('g');
		var len = selected.length;
		rows.attr('transform',function(d,i){
				var pos = (this.getAttribute('order'+mode) || selected.length-1);
				var y = pos/len*height2+margin_top;
				return 'translate(0,'+y+')';
			});	
	}
}

var firstYear = 2006;
var numYears = 8;

function mapUpdateCount(n){
	if(n<10){
		return n;		
	}else if (n < 50){
		return Math.floor(n / 5)+8;
	}else {
		return 18;
	}
}

function mapModuleCount(n){
	if(n<10){
		return n;		
	}else if (n < 50){
		return Math.floor(n / 5)+8;
	}else if (n < 100){
		return Math.floor(n / 10)+13;
	}else{
		return 23;
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
  //This code assumes
  // (1) packages are sorted by the first upload date, and
  // (2) versions are sorted by date within each package.
  // Otherwise, you need to sort by the following code instead.
  	/*
	selected =_.sortBy(_.map(data,function(d){
		var vers = _.sortBy(_.map(d[1],function(v){
			return [v[0],new Date(v[1]),v[2]];
		}),function(v){
			return v[1];  // Sort versions of one package by upload dates
		});
		return [d[0],vers];
	}),function(d){
		return d[1][0][1];  //Sort by the first upload date.
	});
	*/

	calcOrder();

	vs = data[0][0];
	var len = selected.length;
	var count = 0;
	var arr = _.range(0,100);
	var g = [];
	_.each(_.range(0,selected.length),function(i){
		var p = selected[i];
		g[i] = svg1.append('g')
				.attr("x",0)
				.attr('transform',function(d,i){
					var pos = this.getAttribute('order'+currentMode);
					var y = pos/len*height2+margin_top;
					return 'translate(0,'+y+')';
				})
				.attr('data-first-year',p[1][0][1].getFullYear())
				.attr('data-update-count',mapUpdateCount(p[1].length))
				.attr('data-modules',mapModuleCount(p[1][p[1].length-1][2]))
				.attr('order0',''+order[0][i])
				.attr('order1',''+order[1][i])
				.attr('order2',''+order[2][i]);

		_.each(_.range(0,p[1].length),function(j){
			var v = p[1][j];
			g[i].append('rect')
				.attr('class','point')
				.attr('data-year',v[1].getFullYear())
		    	.attr("x", (1 - (new Date(""+(firstYear+numYears)+"-01-01") - v[1])/(1000*60*60*24*365*numYears))*width2+margin_left)
		   		.attr("width", pixelSize)
		   		.attr("height", pixelSize)
	    		.style('fill',function(){return scaled_color(v[2],0,20);});
	    });
	});
	svg1.append('line')
    	.attr("x1", margin_left)
		.attr("y1", margin_top)
   		.attr("x2", width-margin_left)
   		.attr("y2", margin_top)
		.style('stroke','black')
		.style('stroke-width:1');

	var dx = width2/numYears;
	_.each(_.range(0,numYears),function(i){
		svg1.append('text')
			.attr("color", 'black')
			.style("text-anchor", 'middle')
			.attr("x", (i+0.5)*dx+margin_left)
	    	.attr("y", margin_top-5) 
	    	.text(''+(firstYear+i))
			.style("font-family", 'Helvetica, Sans-Serif');
	});
	_.each(_.range(0,11),function(i){
		svg1.append('line')
			.attr("x1", i*dx+margin_left)
	    	.attr("y1", margin_top-3) 
			.attr("x2", i*dx+margin_left)
	    	.attr("y2", margin_top+height2)
			.style('stroke','rgba(0,0,0,0.5)')
			.style('stroke-width:1');
	});

}

var count = 0;

svg1 = d3.select("#canvas").append("svg")
	.attr("width",width)
	.attr("height",height)
	.style("border","1px solid black")
	.style("background","#fff");

d3.select("#order").on("change", function() {
	var v = this.value;
	changeMode(parseInt(v));
});

d3.select("#animation").on("change", function() {
	animation = this.checked;
});

//changeMode(0);

