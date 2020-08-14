var glb = {}
glb.G = 5000.0; // gravitation constant
glb.nr_o_galaxies = 3;
glb.nr_o_stars_in_galaxy = 1000;
glb.simulation_duration_s = 10;
glb.inner_diameter = 5
glb.outer_diameter = 50


var canvas = document.getElementById("canvas");
window.addEventListener("resize", this.resize, false);
var w = canvas.width;
var h = canvas.height;
var ctx = canvas.getContext("2d");
var pause = false;
var restart = true;
canvas.addEventListener('click', function() {
  //pause = !pause;
  restart = true;
}, false);


function resize() {
  console.log("resize " + w + " " + h);        
  canvas.width  = window.innerWidth;
  w = canvas.width;
  canvas.height = window.innerHeight;
  h = window.innerHeight
}

this.gui = new dat.GUI();
this.gui.add(glb, "G", 1)
this.gui.add(glb, "nr_o_galaxies", 2,10, 1)
this.gui.add(glb, "simulation_duration_s", 1,100, 1)
gui_galaxy_spec = this.gui.addFolder("galaxy specs")
gui_galaxy_spec.add(glb, "inner_diameter", 5, 100, 1)
gui_galaxy_spec.add(glb, "outer_diameter", 10, 100, 1)


/**
 *
 */
function BlackHole(M, p, v) {
  this.M = M;
  this.p = p;
  this.v = v;

  this.update = function(black_holes, dt) {
    p[0] += v[0] * dt;
    p[1] += v[1] * dt;
    p[2] += v[2] * dt;

    for (var black_hole of black_holes) {
      if (black_hole != this) {
        var d_x = black_hole.p[0] - this.p[0];
        var d_y = black_hole.p[1] - this.p[1];
     	  var d_z = black_hole.p[2] - this.p[2];
        var d2 = d_x * d_x + d_y * d_y + d_z * d_z;
        var d = Math.sqrt(d2);
        var a_x = glb.G * black_hole.M * d_x / (d2 * d);
        var a_y = glb.G * black_hole.M * d_y / (d2 * d);
        var a_z = glb.G * black_hole.M * d_z / (d2 * d);

        v[0] += a_x * dt;
        v[1] += a_y * dt;
        v[2] += a_z * dt;
      }
    }
  }

  this.draw = function(ctx) {
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(this.p[0] - 1, this.p[1] - 1, 3, 3);
  }
}

/**
 * star object def.
 */
function Star(p, v) {
  this.p = p;
  this.v = v;

  this.update = function(black_holes, dt) {
    p[0] += v[0] * dt;
    p[1] += v[1] * dt;
    p[2] += v[2] * dt;
    for (var black_hole of black_holes) {
      var d_x = black_hole.p[0] - this.p[0];
      var d_y = black_hole.p[1] - this.p[1];
      var d_z = black_hole.p[2] - this.p[2];
      var d2 = d_x * d_x + d_y * d_y + d_z * d_z;
      var d = Math.sqrt(d2);
      var a_x = glb.G * black_hole.M * d_x / (d2 * d);
      var a_y = glb.G * black_hole.M * d_y / (d2 * d);
      var a_z = glb.G * black_hole.M * d_z / (d2 * d);

      v[0] += a_x * dt;
      v[1] += a_y * dt;
      v[2] += a_z * dt;
    }
    var speed = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return speed;
  }

  this.draw = function(ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.p[0], this.p[1], 1, 1);
  }
}


var stars = [];
var black_holes = [];

function create_universe() {
	stars = [];
  black_holes = [];
  for (var i = 0; i < glb.nr_o_galaxies; i++){
    var p = [0.0, 100.0 + 100.0*Math.random(), 0.0]
    var angle = Math.random() * 2.0 * Math.PI;
    p = rotz(angle, p);
    p = sumv(p, [w/2, h/2, 0]);
    var v = [-400 + 800* Math.random(), -400 + 800* Math.random(), 0];
    //v = [0,0,0];
    create_galaxy(p, v); 
  }
  //  create_galaxy([150.0, 150.0, 0], [100,0,0])
  //  create_galaxy([500.0, 150.0, 0], [0,200,0])
  //  create_galaxy([300.0, 400.0, 0], [-400,0,0])
}

function create_galaxy(gpos, vnul) {
  var dmin = glb.inner_diameter,
      dmax = glb.outer_diameter;
  var n_stars = glb.nr_o_stars_in_galaxy;
  var M = 15.0 * n_stars;
  var ang_y = Math.random()*2.0*Math.PI;
  var ang_x = Math.random()*2.0*Math.PI;
	
  for (i = 0; i < n_stars; i++) {
    var d = dmin + Math.random() * dmax;
    var V = Math.sqrt(glb.G * M / d);
    var angle = Math.random() * 2.0 * Math.PI;
    var p = [d * Math.cos(angle), -1.0*d * Math.sin(angle), 0.0];
    var v = [V * Math.sin(angle), V * Math.cos(angle), 0.0];
    
    p = roty(ang_y, p);
    v = roty(ang_y, v);

		p = rotx(ang_x, p);
    v = rotx(ang_x, v);

		p = [p[0] + gpos[0], p[1] + gpos[1], p[2] + gpos[2]];
		v = [v[0] + vnul[0], v[1] + vnul[1], v[2] + vnul[2]];

    var star = new Star(p, v);
    stars.push(star);
  }

  var black_hole = new BlackHole(M, gpos, vnul);
  black_holes.push(black_hole);
}


// udpate loop program
var stand = 30;
var fps = 0;
var fps_cntr = 0;
var last_fps_time = 0;
var last_drw_time = 0;
var total_time = 0;

function drawAndUpdate(cur_time) {

  if (last_fps_time == 0) {
    last_fps_time = cur_time; // first round
    last_drw_time = cur_time;
  }
  if ((restart) || (total_time > glb.simulation_duration_s * 1000)) {
  	create_universe();
    restart = false;
    total_time = 0;
  }
  if ((cur_time - last_fps_time) > 1000) {
    fps = fps_cntr;
    fps_cntr = 1;
    last_fps_time = cur_time;
  } else {
    fps_cntr += 1;
  }
  total_time +=  (cur_time - last_drw_time);
  delta_time_s = 0.001;

  // draw background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);
  // draw FPS
  ctx.fillStyle = '#ffffff';
  ctx.font = "10px Arial";
  ctx.fillText("fps : " + fps, 10, 10);
  // draw test square
  ctx.fillStyle = '#00FF00';
  ctx.fillRect(stand, 0, 4, 4);
  stand += 1;
  if (stand > w) stand = 0;

  // update stars
  if (!pause) {
	  for (var star of stars) {
    	star.update(black_holes, delta_time_s);
    }
	  for (var black_hole of black_holes) {
      black_hole.update(black_holes, delta_time_s);
    }
  }
  // draw stars
  for (var star of stars) 
    star.draw(ctx);
  for (var black_hole of black_holes) 
    black_hole.draw(ctx);

  last_drw_time = cur_time;
  requestAnimationFrame(drawAndUpdate);
}

resize();

// start the whole thing up
requestAnimationFrame(drawAndUpdate);



/*  | cos ?  -sin ?   0| |x|   | x cos ? - y sin ?|   |x'|
    | sin ?   cos ?   0| |y| = | x sin ? + y cos ?| = |y'|
    |  0       0      1| |z|   |         z            |z'|  */
function rotz(angle, v) {
	var x = v[0], y = v[1], z = v[2];
  var sina = Math.sin(angle);
  var cosa = Math.cos(angle);
  return [ x*cosa - y*sina , x*sina + y*cosa, z];
}
/*  | cos ?    0   sin ?| |x|   | x cos ? + z sin ?|   |x'|
    |   0      1       0| |y| = |         y        | = |y'|
    |-sin ?    0   cos ?| |z|   |-x sin ? + z cos ?|   |z'|  */
function roty(angle, v) {
	var x = v[0], y = v[1], z = v[2];
  var sina = Math.sin(angle);
  var cosa = Math.cos(angle);
  return [ x*cosa + z*sina , y, -x*sina + z*cosa];
}
/*  |1     0           0| |x|   |        x        |   |x'|
    |0   cos ?    -sin ?| |y| = |y cos ? - z sin ?| = |y'|
    |0   sin ?     cos ?| |z|   |y sin ? + z cos ?|   |z'|    */
function rotx(angle, v) {
	var x = v[0], y = v[1], z = v[2];
  var sina = Math.sin(angle);
  var cosa = Math.cos(angle);
  return [ x, y*cosa - z*sina , y*sina + z*cosa];
}  
function sumv(p, d){
	return [p[0] + d[0], p[1] + d[1], p[2] + d[2]]
}

    
    