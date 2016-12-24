// ranges are inclusive of first,
// exclusive of second

var LEFT_EYEBROW_RANGE = [174, 194];
var RIGHT_EYEBROW_RANGE = [154, 174];
var NOSE_RANGE = [41, 58];
var CHIN_RANGE = [0, 41];
var RIGHT_EYE_RANGE = [114, 134];
var LEFT_EYE_RANGE = [134, 154];
var MOUTH_OUTLINE_RANGE = [58, 86];
var MOUTH_LIPLINE_RANGE = [86, 114];

var _defaults = {
}

// constructor
var HelenFace = function(annotations, opts) {

	if(!annotations) {
		throw new Error('Must init Face with annotations.');
	}

	this.opts = Object.assign(_defaults, (opts||{}));
	this.annotations = annotations;
	this.extents = this._getAnnotationExtents(annotations);
	this.normalized = this._normalizeAnnotations(annotations, this.extents);
	this.centroids = this._calcCentroids(this.normalized);
	this.features = {
		'left_eyebrow' : LEFT_EYEBROW_RANGE,
		'right_eyebrow' : RIGHT_EYEBROW_RANGE,
		'left_eye' : LEFT_EYE_RANGE,
		'right_eye' : RIGHT_EYE_RANGE,
		'nose' : NOSE_RANGE,
		'mouth_outline' : MOUTH_OUTLINE_RANGE,
		'mouth_lipline' : MOUTH_LIPLINE_RANGE,
		'chin' : CHIN_RANGE
	}
}

//
// PUBLIC METHODS
// 
// 

HelenFace.prototype.draw = function(x, y, width) {

	var iterator = this._getIterator('basic', {
		x: x,
		y: y, 
		width: width,
	});

	return this._drawPoints(this.normalized, iterator);
}

HelenFace.prototype.drawFeatures = function(x, y, width) {
	var polygons = {};

	var iterator = this._getIterator('basic', {
		x: x,
		y: y, 
		width: width
	});

	Object.keys(this.features).forEach(function(key, i) {
		polygons[key] = this._drawPoints(this.normalized, iterator, this.features[key]);
	}, this);

	return polygons;
}

HelenFace.prototype.drawCentered = function(x, y, width) {

	// draw centered
	// var iterator = function(v, i) {
	// 	var xx = width * (v.x - centroid.x) + x;
	// 	var yy = width * (v.y - centroid.y) + y;
	// 	b.vertex(xx, yy);		
	// }

	var iterator = this._getIterator('centered', {
		x: x,
		y: y, 
		width: width,
		centroid: his.centroids.face
	});

	return this._drawPoints(this.normalized, iterator);

}

HelenFace.prototype.drawFeaturesCentered = function(x, y, width) {
	var polygons = {};

	// draw centered
	// var iterator = function(v, i) {
	// 	var xx = width * (v.x - centroid.x) + x;
	// 	var yy = width * (v.y - centroid.y) + y;
	// 	b.vertex(xx, yy);		
	// }

	var iterator = this._getIterator('centered', {
		x: x,
		y: y, 
		width: width,
		centroid: his.centroids.face
	});

	Object.keys(this.features).forEach(function(key, i) {
		polygons[key] = this._drawPoints(this.normalized, iterator, this.features[key]);
	}, this);

	return polygons;
}



HelenFace.prototype.getPoints = function(x, y, scale) {
	return this.normalized;
}

HelenFace.prototype.getLeftEyePoints = function(x, y, scale) {
	return this.normalized.slice(LEFT_EYE_RANGE[0], LEFT_EYE_RANGE[1]);
}

HelenFace.prototype.getRightEyePoints = function(x, y, scale) {
	return this.normalized.slice(RIGHT_EYE_RANGE[0], RIGHT_EYE_RANGE[1]);
}

HelenFace.prototype.getMouthPoints = function(x, y, scale) {
	return this.normalized.slice(MOUTH_OUTLINE_RANGE[0], MOUTH_OUTLINE_RANGE[1]);
}

//
// PRIVATE METHODS
// 

HelenFace.prototype._getIterator = function(type, vars) {

	var iterators = {
		'basic' : function(v, i) {
			var xx = vars.width * v.x + vars.x;
			var yy = vars.width * v.y + vars.y;

			b.vertex(xx, yy);			
		}
		'centered' : function(v, i) {
			var xx = vars.width * (v.x - vars.centroid.x) + vars.x;
			var yy = vars.width * (v.y - vars.centroid.y) + vars.y;
			b.vertex(xx, yy);				
		}
	}

	return iterators[type];

}

HelenFace.prototype._drawPoints = function(points, iterator, range) {

	// slice points
	if(typeof range !== 'undefined') {
		points = points.slice(range[0], range[1]);
	}

	b.beginShape();
	points.forEach(iterator);
	return b.endShape();
}

HelenFace.prototype._getAnnotationExtents = function (annotations) {

	var xExtents = [];
	var yExtents = [];

	var xs = annotations.map(function(d) { return d[0]; });
	var ys = annotations.map(function(d) { return d[1]; });

	var xMin = b.min(xs);
	var xMax = b.max(xs);
	var yMin = b.min(ys);
	var yMax = b.max(ys);

	var aspect = Math.abs(xMax - xMin) / Math.abs(yMax - yMin);

	xExtents = [xMin, xMax];
	yExtents = [yMin, yMax];

	return { x: xExtents, y: yExtents, aspect: aspect };
}


HelenFace.prototype._normalizeAnnotations = function (annotations, extents) {

	return normalized = annotations.map(function(d, i) {
		var x = b.norm(d[0], extents.x[0], extents.x[1]);
		var y = b.norm(d[1], extents.y[0], extents.y[1]) * extents.aspect;

		return new b.Vector(x, y);
	});
}

HelenFace.prototype._calcCentroids = function (annotations) {

	var mouth_centroid = this._calcCentroid(annotations.slice(MOUTH_OUTLINE_RANGE[0], MOUTH_OUTLINE_RANGE[1]));
	var left_eye_centroid = this._calcCentroid(annotations.slice(LEFT_EYE_RANGE[0], LEFT_EYE_RANGE[1]));
	var right_eye_centroid = this._calcCentroid(annotations.slice(RIGHT_EYE_RANGE[0], RIGHT_EYE_RANGE[1]));

	return {
		mouth: mouth_centroid,
		left_eye: left_eye_centroid,
		right_eye: right_eye_centroid,
		face: this._calcCentroid([mouth_centroid, left_eye_centroid, right_eye_centroid])
	}

}

HelenFace.prototype._calcCentroid = function (points) {
	var len = points.length;

	var avgX = points.reduce(function(a, b) { return a + b.x; }, 0)/len;
	var avgY = points.reduce(function(a, b) { return a + b.y }, 0)/len;

	return new b.Vector(avgX, avgY);
}