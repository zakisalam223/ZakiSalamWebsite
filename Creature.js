import { Segment } from "./Segment.js";

export class Creature {
    body = [];

    constructor(x, y, color, numberOfSegments, segmentSizes, boundingBox) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.numberOfSegments = numberOfSegments;
        this.segmentSizes = segmentSizes;
        this.boundingBox = boundingBox; // { left, top, width, height }

        this.angle = 0;
        this.target = { x, y };
        this.targetRadius = 50; // how close before picking a new target
        this.minimumDistance = 100; // the minimum distance its next target must be away from it
        this.wanderInterval = 10000; // ms before forcing a new target
        this.lastTargetTime = 0;


        this.normX = (x - boundingBox.left) / boundingBox.width;
        this.normY = (y - boundingBox.top) / boundingBox.height;


        const d = 100;
        for (var i = 0; i < this.numberOfSegments; i++) {
            const r = segmentSizes[i];
            const prevR = i > 0 ? segmentSizes[i - 1] : r;
            const spacing = (r + prevR);
            this.body.push(new Segment(x - (i * spacing), y, 0, r, d / 20, this.color));
        }
    }

    reproject(oldBox, newBox) {
        for (const seg of this.body) {
            const nx = (seg.x - oldBox.left) / oldBox.width;
            const ny = (seg.y - oldBox.top) / oldBox.height;
            seg.x = newBox.left + nx * newBox.width;
            seg.y = newBox.top + ny * newBox.height;
        }
    }

    pickNewTarget() {
        const { left, top, width, height } = this.boundingBox;
        const padding = 200;
        const head = this.body[0];
        const maxTurnAngle = Math.PI * 0.7;
        let possibleTarget, angleDiff;
        let attempts = 0;

        do {
            possibleTarget = {
                x: left + padding + Math.random() * (width - padding * 1.4),
                y: top + padding + Math.random() * (height - padding * 2),
            };

            const targetAngle = Math.atan2(possibleTarget.y - head.y, possibleTarget.x - head.x);
            angleDiff = targetAngle - this.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            attempts += 1;

        } while (attempts < 50 && (
            Math.hypot(possibleTarget.x - head.x, possibleTarget.y - head.y) < this.minimumDistance ||
            Math.abs(angleDiff) > maxTurnAngle
        ));

        this.target = possibleTarget;
    }

    display(ctx) {
        for (var i = 0; i < this.numberOfSegments; i++) {
            let seg = this.body[i];
            seg.draw(ctx);
        }
    }

    update(time, mouse, boundingBox) {

        if (this.boundingBox &&
            (this.boundingBox.width !== boundingBox.width ||
                this.boundingBox.height !== boundingBox.height ||
                this.boundingBox.left !== boundingBox.left ||
                this.boundingBox.top !== boundingBox.top)) {
            this.reproject(this.boundingBox, boundingBox);

            const nx = (this.target.x - this.boundingBox.left) / this.boundingBox.width;
            const ny = (this.target.y - this.boundingBox.top) / this.boundingBox.height;
            this.target.x = boundingBox.left + nx * boundingBox.width;
            this.target.y = boundingBox.top + ny * boundingBox.height;
        }

        // updating bounding box for if window is resized etc.
        this.boundingBox = boundingBox;

        const head = this.body[0];
        const speed = 0.7;
        const speedFollowing = 2;
        const turnSpeed = 0.01;
        const turnSpeedFollowing = 0.04;

        for (var i = 1; i < this.numberOfSegments; i++) {
            const currentSeg = this.body[i];
            const prevSeg = this.body[i - 1];
            currentSeg.update(prevSeg);
        }

        if (mouse.x >= this.boundingBox.left &&
            mouse.x <= this.boundingBox.left + this.boundingBox.width &&
            mouse.y >= this.boundingBox.top &&
            mouse.y <= this.boundingBox.top + this.boundingBox.height
        ) {

            var a = Math.atan2(mouse.y - head.y, mouse.x - head.x);

            const distToMouse = Math.hypot(mouse.x - head.x, mouse.y - head.y);
            if (distToMouse > head.radius * 2) {

                let angleDiff = a - this.angle;
                while (angleDiff > Math.PI) {
                    angleDiff -= Math.PI * 2;
                }
                while (angleDiff < -Math.PI) {
                    angleDiff += Math.PI * 2;
                }

                this.angle += angleDiff * turnSpeedFollowing;
                head.angle = this.angle;

                head.x += speedFollowing * Math.cos(head.angle);
                head.y += speedFollowing * Math.sin(head.angle);
            }

        } else {
            const dx = this.target.x - head.x;
            const dy = this.target.y - head.y;
            const dist = Math.hypot(dx, dy);

            const a = Math.atan2(dy, dx);

            let angleDiff = a - this.angle;
            while (angleDiff > Math.PI) {
                angleDiff -= Math.PI * 2;
            }
            while (angleDiff < -Math.PI) {
                angleDiff += Math.PI * 2;
            }

            this.angle += angleDiff * turnSpeed;
            head.angle = this.angle;

            head.x += speed * Math.cos(head.angle);
            head.y += speed * Math.sin(head.angle);

            if (dist < this.targetRadius || time - this.lastTargetTime > this.wanderInterval) {
                this.pickNewTarget();
                this.lastTargetTime = time;
            }
        }
    }

    drawBody(ctx) {
        ctx.beginPath();

        for (let i = 0; i < this.numberOfSegments - 1; i++) {
            const seg = this.body[i];
            const nextSeg = this.body[i + 1];
            var x1, y1;
            var x2, y2;

            x1 = seg.x + seg.radius * Math.cos(seg.angle - 0.5 * Math.PI);
            y1 = seg.y + seg.radius * Math.sin(seg.angle - 0.5 * Math.PI);
            x2 = nextSeg.x + nextSeg.radius * Math.cos(nextSeg.angle - 0.5 * Math.PI);
            y2 = nextSeg.y + nextSeg.radius * Math.sin(nextSeg.angle - 0.5 * Math.PI);

            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);

            x1 = seg.x + seg.radius * Math.cos(seg.angle + 0.5 * Math.PI);
            y1 = seg.y + seg.radius * Math.sin(seg.angle + 0.5 * Math.PI);
            x2 = nextSeg.x + nextSeg.radius * Math.cos(nextSeg.angle + 0.5 * Math.PI);
            y2 = nextSeg.y + nextSeg.radius * Math.sin(nextSeg.angle + 0.5 * Math.PI);

            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
        }

        // head
        const headSeg = this.body[0];
        ctx.moveTo(
            headSeg.x + headSeg.radius * Math.cos(headSeg.angle + Math.PI / 2),
            headSeg.y + headSeg.radius * Math.sin(headSeg.angle + Math.PI / 2)
        );
        ctx.arc(headSeg.x, headSeg.y, headSeg.radius, headSeg.angle + Math.PI / 2, headSeg.angle - Math.PI / 2, true);

        ctx.lineWidth = 3;
        ctx.strokeStyle = "#000000";
        ctx.stroke();
    }

}