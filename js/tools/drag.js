(function() {
  var Drag, _, absPos, def, error, log, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require('lodash');

  ref = require('./tools'), def = ref.def, absPos = ref.absPos;

  log = require('./log');

  error = function() {
    return console.error("ERROR: " + ([].slice.call(arguments, 0)).join(" "));
  };

  Drag = (function() {
    function Drag(cfg) {
      this.deactivate = bind(this.deactivate, this);
      this.activate = bind(this.activate, this);
      this.dragStop = bind(this.dragStop, this);
      this.dragUp = bind(this.dragUp, this);
      this.dragMove = bind(this.dragMove, this);
      this.dragStart = bind(this.dragStart, this);
      var ref1, t;
      _.extend(this, def(cfg, {
        target: null,
        handle: null,
        minPos: null,
        maxPos: null,
        onStart: null,
        onMove: null,
        onStop: null,
        active: true,
        cursor: 'move'
      }));
      if (typeof this.target === 'string') {
        t = document.getElementById(this.target);
        if (t == null) {
          error('cant find drag target with id', this.target);
          return;
        }
        this.target = t;
      }
      if (this.target == null) {
        error('cant find drag target', this.target);
        return;
      }
      if ((this.minPos != null) && (this.maxPos != null)) {
        ref1 = [this.minPos.min(this.maxPos), this.minPos.max(this.maxPos)], this.minPos = ref1[0], this.maxPos = ref1[1];
      }
      this.dragging = false;
      this.listening = false;
      if (typeof this.handle === 'string') {
        this.handle = document.getElementById(this.handle);
      }
      if (this.handle == null) {
        this.handle = this.target;
      }
      this.handle.style.cursor = this.cursor;
      if (this.active) {
        this.activate();
      }
      return;
    }

    Drag.prototype.dragStart = function(event) {
      if (this.dragging || !this.listening) {
        return;
      }
      this.dragging = true;
      this.startPos = absPos(event);
      this.pos = absPos(event);
      if (this.onStart != null) {
        this.onStart(this, event);
      }
      this.lastPos = absPos(event);
      document.addEventListener('mousemove', this.dragMove);
      return document.addEventListener('mouseup', this.dragUp);
    };

    Drag.prototype.dragMove = function(event) {
      if (!this.dragging) {
        return;
      }
      this.pos = absPos(event);
      this.delta = this.lastPos.to(this.pos);
      this.deltaSum = this.startPos.to(this.pos);
      if ((this.minPos != null) && (this.maxPos != null)) {
        this.cpos = this.pos.clamped(this.minPos, this.maxPos);
      }
      if (this.onMove != null) {
        this.onMove(this, event);
      }
      return this.lastPos = this.pos;
    };

    Drag.prototype.dragUp = function(event) {
      return this.dragStop(event);
    };

    Drag.prototype.dragStop = function(event) {
      if (!this.dragging) {
        return;
      }
      document.removeEventListener('mousemove', this.dragMove);
      document.removeEventListener('mouseup', this.dragUp);
      delete this.lastPos;
      delete this.startPos;
      if ((this.onStop != null) && (event != null)) {
        this.onStop(this, event);
      }
      this.dragging = false;
    };

    Drag.prototype.activate = function() {
      if (this.listening) {
        return;
      }
      this.listening = true;
      this.handle.addEventListener('mousedown', this.dragStart);
    };

    Drag.prototype.deactivate = function() {
      if (!this.listening) {
        return;
      }
      this.handle.removeEventListener('mousedown', this.dragStart);
      this.listening = false;
      if (this.dragging) {
        this.dragStop();
      }
    };

    return Drag;

  })();

  module.exports = Drag;

}).call(this);
