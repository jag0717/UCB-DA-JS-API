// global variables
var otu;	
var otu_desc = [];
var pie_desc = [];
var restyle = 'no';

function loadPage()
{
	var default_url = "/names";
	
	// populate sample names dropdown when the page loads
	Plotly.d3.json(default_url, function(error, response) {
		if (error) return console.warn(error);
		var data = response;
		console.log(data);
	
		// populate sample ids
		for (i=0; i < data.length; i++)
			d3.select("#selDataset").append("option").text(data[i]).attr("value",data[i]);

		// load MetaData when the page loads
		var dflt_sample = document.getElementById('selDataset').value;
		console.log('default sample:' + dflt_sample);
		getMetadata(dflt_sample);
		getData(dflt_sample);				
	});

}

loadPage();

// Get new data whenever the dropdown selection changes
function getData(sample_id)
{	
	console.log("otu desc:" + otu_desc.length);
	// OTU description
	url = "/otu";	
	console.log(url);

	Plotly.d3.json(url, function(error, data) {
		if (error) return console.warn(error);
		// console.log("otu data:" + data);
		otu = data;
	});

	url = "/samples/"+ sample_id;	
	console.log(url);

	Plotly.d3.json(url, function(error, data) {
		if (error) return console.warn(error);
		console.log("Newdata:", data);

		pie_desc = [];
		for(i=0; i<10; i++ )
		{
			for(j=0; j<otu.length; j++)
			{
				if(data['otu_ids'][i] == otu[j]['otu_id'] ) 
					pie_desc[i] = otu[j]['desc']
			}
		}
		console.log("pie desc length:"+ pie_desc.length);	
		
		otu_desc = [];
		for(i=0; i<data['otu_ids'].length; i++)
		{
			for(j=0; j<otu.length; j++)
			{
				if(data['otu_ids'][i] == otu[j]['otu_id'] ) 
					otu_desc[i] = otu[j]['desc']
			}
		}
		console.log("otu desc length:"+ otu_desc.length);
		
		updatePiePlot(data, pie_desc);
		updateScatterPlot(data, otu_desc);

	});
	gaugeChart(sample_id);
} 

function updatePiePlot(data,desc)
{
	// plot pie chart
	var pie_data = [{
		values: data['sample_values'].slice(0,10),
		labels: data['otu_ids'].slice(0,10),
		text: desc,
		textinfo: "percent",
		type: 'pie'
		}];
	
	var pie_layout = {
		height: 500,
		width: 500
		};

	var PIE = document.getElementById('pie');
	console.log('restyle:', restyle);

	if (restyle == 'no')
		Plotly.newPlot(PIE, pie_data, pie_layout); 	
	else
	{
		Plotly.restyle(PIE, 'values', [data['sample_values'].slice(0,10)]);
		Plotly.restyle(PIE, 'labels', [data['otu_ids'].slice(0,10)]);
	} 
}

function updateScatterPlot(data, desc)
{
	// scatter plot
	var trace1 =
	{
		x: data['otu_ids'],
		y: data['sample_values'],
		mode: 'markers',
		type: 'scatter',
		text: desc,
		hoverinfo: "x+y+text",
		marker: { size: data['sample_values'], color: data['otu_ids'] }
	};

	sdata = [trace1];
	
	var layout = { title: 'Scatter Plot with a Color Dimension' };
	var plot = document.getElementById('splot');

	if (restyle == 'no')
		Plotly.newPlot(plot, sdata, layout);
	else
	{
		Plotly.restyle(plot,'x',[data['otu_ids']] );
		Plotly.restyle(plot,'y',[data['sample_values']] );
		Plotly.restyle(plot,'marker.size',[data['sample_values']] );
		Plotly.restyle(plot,'marker.color',[data['otu_ids']] );				
	}
}

// Get Metadata
function getMetadata(sample_id)
{
	var url = "/metadata/"+ sample_id;
	var text = "";
	Plotly.d3.json(url, function(error, response) {
		if (error) return console.warn(error);
		var data = response;
		for (const [key, value] of Object.entries(data)) {
		  text = text + key + ": " + value + '<br>';
		}
		document.getElementById("metadata").innerHTML = text;	  		
	  });
}

// event handler for Sample ID
function optionChanged(sample_id)
{
	console.log('sample:' + sample_id);
	// populate metadata
	getMetadata(sample_id);	
	getData(sample_id);		 
}

function gaugeChart(sample_id)
{		   
	// Enter a speed between 0 and 180
	url = "/wfreq/"+ sample_id;

	Plotly.d3.json(url, function(error, response) {
		if (error) return console.warn(error);
			var level = response * 20;			  		
			console.log('wfreq:',response);
			console.log('level:',level);	  
		
	// Trig to calc meter point
	var degrees = 180 - level,
		 radius = .5;
	var radians = degrees * Math.PI / 180;
	var x = radius * Math.cos(radians);
	var y = radius * Math.sin(radians);
	
	// Path: may have to change to create a better triangle
	var mainPath = 'M -.0 -0.025 L .0 0.025 L ',
		 pathX = String(x),
		 space = ' ',
		 pathY = String(y),
		 pathEnd = ' Z';
	var path = mainPath.concat(pathX,space,pathY,pathEnd);
	
	var data = [{ type: 'scatter',
	   x: [0], y:[0],
		marker: {size: 28, color:'850000'},
		showlegend: false,
		name: 'speed',
		text: level,
		hoverinfo: 'text'},
	  { values: [50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50/9,50/9,50/9, 50],
	  rotation: 90,
	  text: ['8-9', '7-8', '6-7', '5-6','4-5', '3-4', '2-3','1-2','0-1',''],
	  textinfo: 'text',
	  textposition:'inside',      
	  marker: {colors:['rgba(50, 100, 0, .5)', 'rgba(20, 150, 0, .5)','rgba(50, 175, 22, .5)','rgba(70, 200, 0, .5)',
	  						 'rgba(100, 127, 0, .5)','rgba(170, 202, 42, .5)', 'rgba(202, 209, 95, .5)',
							 'rgba(210, 206, 145, .5)', 'rgba(232, 226, 202, .5)',
							 'rgba(255, 255, 255, 0)']},
	  text: ['8-9', '7-8', '6-7', '5-6','4-5', '3-4', '2-3','1-2','0-1',''],
	  hoverinfo: 'text',
	  hole: .5,
	  type: 'pie',
	  showlegend: false
	}];
	
	var layout = {
	  shapes:[{
		  type: 'path',
		  path: path,
		  fillcolor: '850000',
		  line: {
			color: '850000'
		  }
		}],
	  title: '<b>Belly Button Washing Frequency</b> <br> Scrubs Per Week',
	  height: 500,
	  width: 500,
	  xaxis: {zeroline:false, showticklabels:false,
				 showgrid: false, range: [-1, 1]},
	  yaxis: {zeroline:false, showticklabels:false,
				 showgrid: false, range: [-1, 1]}
	};
	
		Plotly.newPlot('gauge', data, layout);
		restyle = 'yes';		

	});
}