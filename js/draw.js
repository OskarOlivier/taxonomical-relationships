jQuery(window).ready(function($){

  $('#jswarning').css("display","none");
	
	var width = $("#taxrel").width();
	var originalheight = $("#taxrel").height();
	var height = originalheight;
	
	
	var nodeConf = {
    radius: 6,
    selected: {
      radius: 18
    }
  };
	  
  function calcWeight(x) {
    y = Math.pow(x.weight, 1.5);
    return (y > 0.075) ? y : 0.075;
  }

  function keepCenter(node) {
    node.x = width / 2;
    node.y = height / 2;
  }
  
  d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
  };

  // set up SVG for D3
  //var colors = d3.scale.category10();

  var svg = d3.select('#taxrel')
    .append('svg')
    /*.attr('width', width)
    .attr('height', height);*/
    .attr("viewBox", "0 0 " + width + " " + height );

  /*var tagcount = php_nodes.filter(function(node) {
    return node.group == "tags";
  }).length;
  var catcount = php_nodes.filter(function(node) {
    return node.group == "categories";
  }).length;*/

  var nodes = php_nodes;
  var links = php_links;
  
  var linkedById = {};
  links.forEach(function(d) {
    linkedById[d.source + "," + d.target] = d.weight;
    linkedById[d.target + "," + d.source] = d.weight;
  });
  
  nodes = php_nodes.filter(function(node){ return (node.group == 'categories') });
  links = php_links.filter(function(link){ return (link.source < 19) && (link.target < 19) });
  
  function spliceLinksForNode(node) {
    //console.debug(node.id);
    var toSplice = links.filter(function(l) {
      return (l.source.id == node.id || l.target.id == node.id);
    });
    toSplice.forEach(function(l) {
      //console.debug(["indexOfLink(l, links)",indexOfLink(l, links)]);
      //links.splice(indexOfLink(l,links), 1);
      //console.debug(links.indexOf(l));
      links.splice(links.indexOf(l), 1);
    });
  }

  function onScreen(node) {
    return nodes.some(function(n) {
      return node.id == n.id;
    });
  }
  
  function alreadyLinked(link) {
    return links.some(function(l) {
      return (link.source == l.source && link.target == l.target) ||
             (link.target == l.source && link.source == l.target);
    });
  }

  function indexOfLink(link, links) {
    var index = 0;
    links.forEach(function(l) {
      if (link.source.id == l.source.id && link.target.id == l.target.id) {
        index = links.indexOf(l);
      }
    });
    return index;
  }

  function neighboring(a, b) {
    return linkedById[a.id + "," + b.id];
  }
  
  function trimNodes(snodes, snode, number) {
    var slinks = [];
    snodes.forEach(function(node){
      var slink = {"node": node, "weight": neighboring(snode, node)};
      slinks.push(slink);
    });
    //console.debug(slinks);
    slinks.sort(function(a,b) { return parseFloat(b.weight) - parseFloat(a.weight) } );
    slinks.splice(number);
    var tnodes = [];
    snodes.forEach(function(node){
      slinks.some(function(slink){
        if (slink.node == node) {
          tnodes.push(node);
          return true;
        }
        return false;
      });
    });
    //console.debug(tnodes);
    return tnodes;
  }

  function unrelatedCategories(snode) {
    return nodes.filter(function(node) {
      //console.debug(snode, node, neighboring(snode, node), node.group == 'categories');
      return (snode !== node && !neighboring(snode, node) && node.group == 'categories');
    });
  }

  function relatedCategories(snode) {
    return php_nodes.filter(function(node) {
      //console.debug(node, !onScreen(node), neighboring(snode, node), node.group == 'categories');
      //console.debug(onScreen(node));
      return (!onScreen(node) && neighboring(snode, node) && node.group == 'categories');
    });
  }
  
  function relatedTags(snode) {
    return php_nodes.filter(function(node) {
      //console.debug(node, !onScreen(node), neighboring(snode, node), node.group == 'categories');
      //console.debug(onScreen(node));
      return (!onScreen(node) && neighboring(snode, node) && node.group == 'tags');
    });
  }
  
  function missingCategories() {
    return php_nodes.filter(function(node) {
      return (!onScreen(node) && node.group == 'categories');
    });
  }
  
  function visibleTags() {
    return nodes.filter(function(node) {
      return (onScreen(node) && node.group == 'tags');
    });
  }

  function removeNodes(r) {
    /*console.debug(r);
    console.debug(links);*/
    /*console.debug(index(r[1], nodes));
    console.debug(nodes.indexOf(r[1]));*/
    r.forEach(function(n) {
      nodes.splice(nodes.indexOf(n), 1);
      spliceLinksForNode(n);
    });
    restart();
  }

  function addNodes(r) {
    r.forEach(function(n) {
      nodes.push(n);
    });
    restart();
  }

  function addLinks(r) {
    r.forEach(function(n) {
      nodes.forEach(function(o) {
        if (n !== o && neighboring(n, o)) {
          var link = {source: n.index, target: o.index, weight: linkedById[n.id + "," + o.id]};
          //var duplicate = {source: o.index, target: n.index, weight: linkedById[n.id + "," + o.id]};
          if (!alreadyLinked(link)) {
            //console.debug(links.indexOf(duplicate));
            links.push(link);
          }
        }
      });
    });
    restart();
  }
  
  function tagNodes() {
    return php_nodes.filter(function(node) {
      return (node.group == 'tags');
    });
  }

  function testNodes() {
    return php_nodes.filter(function(node) {
      return (node.id < 10);
    });
  }
  
//  console.debug(links);
//  console.debug(tagNodes());
//  console.debug(links);

  // init D3 force layout
  var force = d3.layout.force()
      .nodes(nodes)
      .links(links)
      .size([width, height])
      .gravity(1)
      .linkDistance(200 / 2)
      .charge(-5000)
      .linkStrength(function(d) { return calcWeight(d) })
      .on('tick', tick);

  // handles to link and node element groups
  var path = svg.append('svg:g').selectAll('path'),
      circle = svg.append('svg:g').selectAll('g');

  // mouse event vars
  var selected_node = null,
      mousedown_link = null,
      mousedown_node = null,
      mouseup_node = null;
      category_node = null;

  function resetMouseVars() {
    mousedown_node = null;
    mouseup_node = null;
    mousedown_link = null;
  }
  
  function resetLayout() {
    removeNodes(visibleTags());
    /*var tags = tagNodes();
    removeNodes(tags);*/
    var t = missingCategories();
    //console.debug(t);
    addNodes(t);
    addLinks(t);
  }
  
  function emptyLayout() {
    nodes.splice(0);
    links.splice(0);
  }
  
  function highlight(event) {
    return function(d) {
      opacity = (event == 'mouseover') ? .2 : 1;
      hover = (event == 'mouseover');
      circle.style("stroke-opacity", function(o) {
        thisOpacity = (neighboring(d, o) || d == o) ? 1 : opacity;
        this.setAttribute('fill-opacity', thisOpacity);
        return thisOpacity;
      });
      
      path.style("stroke", function(o) {
        thisFill = opacity < 1 && (o.source === d || o.target === d) ? '#1397d3' : '#555';
        //this.setAttribute('fill', thisFill);
        return thisFill;
      });
      
      path.style("stroke-opacity", function(o) {
        return o.source === d || o.target === d ? 1 : opacity;
      });
      
      //svg.selectAll("text.label").style("font-size", "");
      svg.selectAll("text.label")
      /*.filter(function(d) {
        return this.className.baseVal.indexOf('selected')<0;
      })*/
      .classed("hover", function(o) {
        return (d == o && hover);
      });
      /*.style("font-size", function(o) {
        thisSize = (d == o) ? size : 12;
        return thisSize;
      });*/
      
      d3.select(this.parentNode).moveToFront();
    };
  }
  
  function moveToFront() {
  }

  // update force layout (called automatically each iteration)
  function tick() {
   
    // draw directed edges with proper padding from node centers
    path.attr('d', function(d) {
      var deltaX = d.target.x - d.source.x,
          deltaY = d.target.y - d.source.y,
          dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
          normX = deltaX / dist,
          normY = deltaY / dist,
          sourcePadding = 12,
          targetPadding = 12,
          sourceX = d.source.x + (sourcePadding * normX),
          sourceY = d.source.y + (sourcePadding * normY),
          targetX = d.target.x - (targetPadding * normX),
          targetY = d.target.y - (targetPadding * normY);
      return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
    });

    circle.attr('transform', function(d) {
      return 'translate(' + d.x + ',' + d.y + ')';
    });

    if(selected_node) {
      keepCenter(selected_node);
    }
  }
    
  // update graph (called when needed)
  function restart() {

    // path (link) group
    path = path.data(links);

    // add new links
    path.enter().append('svg:path')
      .attr('class', 'link');

    // remove old links
    path.exit().remove();
    
    var oScale = d3.scale.linear()
                     .domain([0, d3.max(links, function(d) { return calcWeight(d); })])
                     .range([0.03, 1]);


    svg.selectAll('path')
      .style("opacity",function(d){return oScale(d.weight)});
    //console.debug(links);


    // circle (node) group
    // NB: the function arg is crucial here! nodes are known by id, not by index!
    circle = circle.data(nodes, function(d) { return d.id; });

    // update existing nodes (selected visual states)
    circle.selectAll('circle')
      .attr('r', function(d) { return (d === selected_node) ? nodeConf.selected.radius : nodeConf.radius })
      .classed('selected', function(d) { return (d === selected_node) });

    // add new nodes
    var g = circle.enter().append('svg:g');

    g.append('svg:circle')
      .attr('class', 'node')
      .attr('r', function(d) { return (d === selected_node) ? nodeConf.selected.radius : nodeConf.radius })
      .on('mousedown', function(d) {
        if(d3.event.ctrlKey) return;

        // select node
        mousedown_node = d;
        if(mousedown_node === selected_node) {
          selected_node = null;
        }
        else selected_node = mousedown_node;
        if(mousedown_node.group == 'categories') {
          category_node = mousedown_node;
        }

        restart();
      })
      .on('mouseover', highlight('mouseover'))
      .on('mouseout', highlight('mouseout'));
      
    d3.select("g g").attr('class','node');
    d3.select("g g").classed('selected', function(d) { return (d === selected_node) });

    // update node labels
    svg.selectAll("text.label")
      .attr('y', function(d) { return (d === selected_node) ? 6 : 15})
      .classed('category', function(d) { return d.group == "categories" })
      .classed('tag', function(d) { return d.group == "tags" })
      .classed('selected', function(d) { return (d === selected_node) });
      
    // show node labels
    g.append('svg:text')
        .attr('x', 0)
        .attr('y', 15)
        .attr('class', 'label')
        .text(function(d) { return d.label; })
        .on('mousedown', function(d) {
          if(d3.event.ctrlKey) return;

          // select node
          mousedown_node = d;
          if(mousedown_node === selected_node) {
            selected_node = null;
          }
          else selected_node = mousedown_node;
          if(mousedown_node.group == 'categories') {
            category_node = mousedown_node;
          }

          restart();
        })
        .on('mouseover', highlight('mouseover'))
        .on('mouseout', highlight('mouseout'));

    // remove old nodes
    circle.exit().remove();

    // set the graph in motion
    force.start();
  }
  
  function resize(size) {
    height = size;
    force.size([width, height]);
    svg.attr("viewBox", "0 0 " + width + " " + height );
    $("#taxrel").css("height",height + "px");
  }

  function mousedown() {
    // prevent I-bar on drag
    //d3.event.preventDefault();
    
    // because :active only works in WebKit?
    svg.classed('active', true);
    
    if(mousedown_node && selected_node){
      if(mousedown_node.group == "tags") {
        emptyLayout();
        var t = [category_node, mousedown_node];
        addNodes(t);
        addLinks(t);
        /*var u = relatedCategories(category_node)
        addNodes(u);
        addLinks(u);*/
        resize(200);
      }
      else {
        removeNodes(visibleTags());
        removeNodes(unrelatedCategories(mousedown_node));
        var t = relatedCategories(mousedown_node)
        addNodes(t);
        addLinks(t);
        var u = relatedTags(mousedown_node);
        u = trimNodes(u, mousedown_node, 20);
        addNodes(u);
        addLinks(u);
        resize(originalheight);
      }
    }
    if(mousedown_node && !selected_node) {
      if(mousedown_node.group == "tags") {
        var t = relatedCategories(category_node)
        //console.debug(t);
        addNodes(t);
        addLinks(t);
        var u = relatedTags(category_node);
        u = trimNodes(u, category_node, 20);
        //console.debug(u);
        addNodes(u);
        addLinks(u);
        selected_node = category_node;
        restart();
        resize(originalheight);
      }
      else {
        console.debug("reset");
        resetLayout();
      }
    }
    
    if(d3.event.ctrlKey || mousedown_node || mousedown_link) return;

    restart();
  }

  function mousemove() {
    if(!mousedown_node) return;

    restart();
  }

  function mouseup() {
    // because :active only works in WebKit?
    svg.classed('active', false);

    // clear mouse event vars
    resetMouseVars();
  }
  
  function mouseover() {
  }

  // only respond once per keydown
  var lastKeyDown = -1;

  function keydown() {
    d3.event.preventDefault();

    if(lastKeyDown !== -1) return;
    lastKeyDown = d3.event.keyCode;

    // ctrl
    if(d3.event.keyCode === 17) {
      circle.call(force.drag);
      svg.classed('ctrl', true);
    }

    if(!selected_node) return;
    switch(d3.event.keyCode) {
      case 8: // backspace
      case 46: // delete
        if(selected_node) {
          nodes.splice(nodes.indexOf(selected_node), 1);
          spliceLinksForNode(selected_node);
        } else if(selected_link) {
          links.splice(links.indexOf(selected_link), 1);
        }
        selected_link = null;
        selected_node = null;
        restart();
        break;
      case 70: // F
        removeNodes(unrelatedNodes(selected_node));
        var r = unrelatedNodes(selected_node);
        r.forEach(function(n) {
          document.title = document.title + n.label + '-';
        });
        restart();
        break;
    }
  }

  function keyup() {
    lastKeyDown = -1;

    // ctrl
    if(d3.event.keyCode === 17) {
      circle
        .on('mousedown.drag', null)
        .on('touchstart.drag', null);
      svg.classed('ctrl', false);
    }
  }

  // app starts here
  svg.on('mousedown', mousedown)
    .on('mousemove', mousemove)
    .on('mouseup', mouseup)
    .on('mouseover', mouseover);
  /*d3.select(window)
    .on('keydown', keydown)
    .on('keyup', keyup);*/
  restart();
  /*
  var t = testNodes();
  console.debug(links);
  console.debug(t);
  removeNodes(t);
  
  console.debug(foo);*/

});
