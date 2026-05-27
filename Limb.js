import { EndEffector } from "./EndEffector";

function smoothstep(t) {
    return t * t * (3 - 2 * t);
}

export class Limb {

    constructor(segmentIndex, side, numEffectors, segmentLength, color) {
        this.segmentIndex = segmentIndex; // which body segment to attach to
        this.side = side; // +1 = right, -1 = left
        this.limbSegments = [];
        this.numEffectors = numEffectors;
        this.ls = segmentLength;
        this.color = color;

        this.sum = 0;

        this.target;

        this.footX = 0;
        this.footY = 0;
        this.isStepping = false;
        this.stepProgress = 0; // 0 to 1
        this.stepFrom = { x: 0, y: 0 };
        this.stepTo = { x: 0, y: 0 };
        this.stepSpeed = 0.15;
        this.stepThreshold = 40;   // how far root drifts before triggering a step
        this.stepAheadDistance = 27; // how far ahead of root to plant the foot
        this.restDistanceMultiplier = 1.7; // how far away the foot rests from the body

        for (let i = 0; i < numEffectors; i++) {
            this.limbSegments.push(new EndEffector(0, 0, this.ls));
            this.sum += this.ls;
            this.ls *= 0.8;
        }

        for (let i = 1; i < this.numEffectors; i++) {
            this.limbSegments[i].position = {
                x: this.limbSegments[i - 1].position.x + this.limbSegments[i - 1].length,
                y: 0
            };
        }
    }

    update() {
        this.fabrikF();
        this.fabrikB();
    }

    fabrikF() {
        let next = this.limbSegments[this.limbSegments.length - 1];
        next.position = this.target.position;

        for (var i = this.limbSegments.length - 2; i >= 0; i--) {
            const current = this.limbSegments[i];
            const direction = {
                x: current.position.x - next.position.x,
                y: current.position.y - next.position.y
            };

            const dist = Math.hypot(direction.x, direction.y);

            const normalized = {
                x: direction.x / dist,
                y: direction.y / dist
            };

            current.position = {
                x: next.position.x + normalized.x * next.length,
                y: next.position.y + normalized.y * next.length
            };

            next = current;
        }
    }

    fabrikB() {
        this.limbSegments[0].position = { x: this.rootX, y: this.rootY };

        for (var i = 1; i < this.limbSegments.length; i++) {
            const prev = this.limbSegments[i - 1];
            const current = this.limbSegments[i];

            const direction = {
                x: current.position.x - prev.position.x,
                y: current.position.y - prev.position.y
            };
            const dist = Math.hypot(direction.x, direction.y);
            const normalized = {
                x: direction.x / dist,
                y: direction.y / dist
            };

            current.position = {
                x: prev.position.x + normalized.x * prev.length,
                y: prev.position.y + normalized.y * prev.length
            };
        }
    }

    getRestPosition(bodySeg) {
        const perpAngle = bodySeg.angle + (Math.PI / 2) * this.side;
        const rootX = bodySeg.x + bodySeg.radius * Math.cos(perpAngle) * this.restDistanceMultiplier;
        const rootY = bodySeg.y + bodySeg.radius * Math.sin(perpAngle) * this.restDistanceMultiplier;

        // placing foot ahead of the root along the body's travel direction
        return {

            x: rootX + Math.cos(bodySeg.angle) * this.stepAheadDistance,
            y: rootY + Math.sin(bodySeg.angle) * this.stepAheadDistance
        };
    }

    // called every frame
    updateRoot(bodySeg) {
        const perpAngle = bodySeg.angle + (Math.PI / 2) * this.side;
        this.rootX = bodySeg.x + bodySeg.radius * Math.cos(perpAngle);
        this.rootY = bodySeg.y + bodySeg.radius * Math.sin(perpAngle);

        this.limbSegments[0].position.x = this.rootX;
        this.limbSegments[0].position.y = this.rootY;

        const rest = this.getRestPosition(bodySeg);
        const distFromRest = Math.hypot(this.footX - rest.x, this.footY - rest.y);

        if (!this.isStepping && distFromRest > this.stepThreshold) {
            this.isStepping = true;
            this.stepProgress = 0;
            this.stepFrom = { x: this.footX, y: this.footY };
            this.stepTo = rest;
        }

        if (this.isStepping) {
            this.stepProgress = Math.min(1, this.stepProgress + this.stepSpeed);
            const t = smoothstep(this.stepProgress);
            this.footX = this.stepFrom.x + (this.stepTo.x - this.stepFrom.x) * t;
            this.footY = this.stepFrom.y + (this.stepTo.y - this.stepFrom.y) * t;
            if (this.stepProgress >= 1) this.isStepping = false;
        }

        this.target = { position: { x: this.footX, y: this.footY } };
    }

    draw(ctx) {

        // outline
        ctx.beginPath();
        ctx.lineWidth = 15;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#000000";

        for (var i = 0; i < this.numEffectors - 1; i++) {
            ctx.moveTo(this.limbSegments[i].position.x, this.limbSegments[i].position.y);

            ctx.lineTo(this.limbSegments[i + 1].position.x, this.limbSegments[i + 1].position.y);
        }
        ctx.stroke();

        // filled in color
        ctx.beginPath();
        ctx.lineWidth = 10;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = this.color;

        for (var i = 0; i < this.numEffectors - 1; i++) {
            ctx.moveTo(this.limbSegments[i].position.x, this.limbSegments[i].position.y);

            ctx.lineTo(this.limbSegments[i + 1].position.x, this.limbSegments[i + 1].position.y);
        }
        ctx.stroke();
    }

}