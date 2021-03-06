var opts = {
	radius: 150,
	segCount: 400,
	endAngle: -Math.PI * 18,
	baseRotSpeed: 5,
	transformedRotSpeed: 1,
	transSpeed: 2,
	transEasing: function(t) { return (t < .5) ? 4 * t * t * t : 1 - 4 * (t = 1 - t) * t * t; },
	randMinSegSize: 10,
	randMaxSegSize: 50
};

var c = document.getElementById('c'),
	ctx = c.getContext('2d');

function resize()
{
	c.width = c.offsetWidth;
	c.height = c.offsetHeight;
	ctx.translate(c.width * .5, c.height * .5);
	ctx.strokeStyle = 'black';
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
}
window.addEventListener('resize', resize);
resize();

function rotateX(p, a)
{
	var d = Math.sqrt(p[2] * p[2] + p[1] * p[1]),
		na = Math.atan2(p[1], p[2]) + a;
	return [p[0], d * Math.sin(na), d * Math.cos(na)];
}
function rotateY(p, a)
{
	var d = Math.sqrt(p[2] * p[2] + p[0] * p[0]),
		na = Math.atan2(p[2], p[0]) + a;
	return [d * Math.cos(na), p[1], d * Math.sin(na)];
}

function loxo(radius, angle, segments)
{
	var r = [];
	for (var i = 0; i < segments; i++)
	{
		var a = Math.PI * i / segments,
			c = Math.cos(a),
			s = Math.sin(a);
		var progress = (c + 1) * .5;
		var ay = progress * angle;
		r.push([radius * s * Math.cos(ay), radius * c, radius * s * Math.sin(ay)]);
	}
	return r;
}

function random(a, b) { return a + Math.random() * (b - a); }
function between(n, m, M) { return n >= m && n <= M; }
function randomPath(n, limit, minDist, maxDist)
{
	var r = [];
	var previous = [random(-limit, limit), random(-limit, limit), random(-limit, limit)];
	for (var i = 0; i < n; i++)
	{
		var p;
		do
		{
			var dist = random(minDist, maxDist);
			var angleA = random(0, Math.PI * 2);
			var angleB = random(0, Math.PI * 2);
			var tmp = dist * Math.sin(angleA);
			p = [previous[0] + dist * Math.cos(angleA), previous[1] + tmp * Math.cos(angleB), previous[2] + tmp * -Math.sin(angleB)];
		} while (!(between(p[0], -limit, limit) && between(p[1], -limit, limit) && between(p[2], -limit, limit)));
		r.push(p);
		previous = p;
	}
	return r;
}
var basePoints = loxo(opts.radius, opts.endAngle, opts.segCount);
var transformedPoints = randomPath(opts.segCount, opts.radius, opts.randMinSegSize, opts.randMaxSegSize);

function lerp(p1, p2, t)
{
	return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1]), p1[2] + t * (p2[2] - p1[2])];
}

function getPoint(i, transform, rotY, rotX)
{
	var bp = basePoints[i],
		tp = transformedPoints[i],
		p = lerp(bp, tp, transform);
	return rotateX(rotateY(p, rotY), rotX);
}
var previousT = Date.now() * 1e-3;
var rot = 0;
var previousTdir;
function loop()
{
	requestAnimationFrame(loop);
	ctx.clearRect(-c.width * .5, -c.height * .5, c.width, c.height);
	var t = Date.now() * 1e-3;
	var deltaT = t - previousT;
	previousT = t;
	var transform = opts.transEasing((Math.sin(t * opts.transSpeed) + 1) * .5);
	// Detect when we change of "transform direction"
	var tdir = (Math.cos(t * opts.transSpeed) > 0) ? 1 : -1;
	if(previousTdir !== tdir)
	{
		previousTdir = tdir;
		// Generate new points
		if(tdir == 1)
			transformedPoints = randomPath(opts.segCount, opts.radius, opts.randMinSegSize, opts.randMaxSegSize);
	}
	var rotSpeed = opts.baseRotSpeed + transform * (opts.transformedRotSpeed - opts.baseRotSpeed);
	rot += deltaT * rotSpeed;
	var rotX = -.5;
	ctx.beginPath();
	var first = getPoint(0, transform, rot, rotX);
	ctx.moveTo(first[0], first[1]);
	var previous = getPoint(1, transform, rot, rotX);
	for (var i = 2, l = opts.segCount - 1; i < l; i++)
	{
		var p = getPoint(i, transform, rot, rotX);
		var xc = (previous[0] + p[0]) * .5;
		var yc = (previous[1] + p[1]) * .5;
		ctx.quadraticCurveTo(previous[0], previous[1], xc, yc);
		previous = p;
	}
	var last = getPoint(opts.segCount - 1, transform, rot, rotX);
	ctx.quadraticCurveTo(previous[0], previous[1], last[0], last[1]);
	ctx.stroke();
}
requestAnimationFrame(loop);