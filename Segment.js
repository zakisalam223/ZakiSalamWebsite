export class Segment {

    constructor(x, y, angle, radius, distance, color) {
        this.x = x;
        this.y = y;
        this.angle = angle; // angle the segment is facing
        this.radius = radius;
        this.distance = distance;
        this.color = color;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();


        // debug direction line
        // const endX = this.x + Math.cos(this.angle) * this.radius;
        // const endY = this.y + Math.sin(this.angle) * this.radius;
        // ctx.beginPath();
        // ctx.moveTo(this.x, this.y);
        // ctx.lineTo(endX, endY);
        // ctx.strokeStyle = 'white';
        // ctx.lineWidth = 2;
        // ctx.stroke();
    }

    update(prevSegment) {

        const angleBetweenSegments =  Math.atan2(
            prevSegment.y - this.y,
            prevSegment.x - this.x
        );

        const maxBend = Math.PI / 4;
        let angleDiff = angleBetweenSegments - prevSegment.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        this.angle = prevSegment.angle + Math.max(-maxBend, Math.min(maxBend, angleDiff));
        this.x = prevSegment.x - Math.cos(this.angle) * this.distance;
        this.y = prevSegment.y - Math.sin(this.angle) * this.distance;

    }



}