"use client";

import React, { useEffect } from "react";
//import * as noise from "@chriscourses/perlin-noise";
const { noise } = require("@chriscourses/perlin-noise");

class Vector2 {
  private xVelocity: number;
  private yVelocity: number;
  private xOrgin: number;
  private yOrgin: number;

  constructor(
    xOrgin: number,
    yOrgin: number,
    xVelocity: number = 1,
    yVelocity: number = 0
  ) {
    this.xVelocity = xVelocity;
    this.yVelocity = yVelocity;
    this.xOrgin = xOrgin;
    this.yOrgin = yOrgin;
  }

  render(c: any) {
    c.beginPath();
    c.moveTo(this.xOrgin, this.yOrgin);
    c.lineTo(this.xOrgin + this.xVelocity, this.yOrgin - this.yVelocity);
    c.stroke();
    c.closePath();
  }

  getNormalizedVelocity(maxSpeed: number): normalizedVelocity {
    const velLength = Math.sqrt(
      this.xVelocity * this.xVelocity + this.yVelocity * this.yVelocity
    );
    if (velLength > maxSpeed) {
      const m = maxSpeed / velLength;
      return { xVel: this.xVelocity * m, yVel: this.yVelocity * m };
    }

    return { xVel: this.xVelocity, yVel: this.yVelocity };
  }
}

type prevCoords = {
  x?: number;
  y?: number;
};

type normalizedVelocity = {
  xVel: number;
  yVel: number;
};

class Particle {
  private xPos: number;
  private yPos: number;
  private xVelocity: number;
  private yVelocity: number;
  private radius: number;
  private r: number = 255;
  private g: number = 0;
  private b: number = 0;
  private a: number = 0.4;
  private currentlyUpdating: string = "r";
  private colorSwapTime: number = 0.1;

  constructor(
    xPos: number,
    yPos: number,
    xVelocity: number,
    yVelocity: number,
    radius: number = 5
  ) {
    this.xPos = xPos;
    this.yPos = yPos;
    this.xVelocity = xVelocity;
    this.yVelocity = yVelocity;
    this.radius = radius;
  }

  setVelocity(newXVelocity: number, newYVelocity: number) {
    this.xVelocity = newXVelocity;
    this.yVelocity = newYVelocity;
  }

  private render(c: any, r: number, g: number, b: number, a: number) {
    c.beginPath();
    c.fillStyle = `rgba(${r},${g},${b},${a})`;
    c.arc(this.xPos, this.yPos, this.radius, 0, Math.PI * 2);
    c.fill();
    c.closePath();
  }

  updatePosition(c: any, flowFieldVectors: Vector2[][]) {
    //Wrap particles if at edge of screen
    if (this.xPos >= innerWidth) {
      this.xPos = 1;
    } else if (this.xPos <= 0) {
      this.xPos = innerWidth - 1;
    }

    if (this.yPos >= innerHeight) {
      this.yPos = 1;
    } else if (this.yPos <= 0) {
      this.yPos = innerHeight - 1;
    }

    //Determine nearest flow field vector
    let xOrgin = Math.floor(this.xPos / 30) * 30;
    let yOrgin = Math.floor(this.yPos / 30) * 30;

    //Get normalized velocity
    const normalizedVelocity: normalizedVelocity =
      flowFieldVectors[xOrgin][yOrgin].getNormalizedVelocity(1);
    //console.log(normalizedVelocity.xVel, normalizedVelocity.yVel);

    this.xPos += normalizedVelocity.xVel;
    this.yPos += normalizedVelocity.yVel;

    switch (this.currentlyUpdating) {
      case "r":
        this.r -= this.colorSwapTime;
        this.g += this.colorSwapTime;
        if (this.r <= 0) {
          this.g = 255;
          this.r = 0;
          this.currentlyUpdating = "g";
        }
        break;
      case "g":
        this.g -= this.colorSwapTime;
        this.b += this.colorSwapTime;
        if (this.g <= 0) {
          this.b = 255;
          this.g = 0;
          this.currentlyUpdating = "b";
        }
        break;
      case "b":
        this.b -= this.colorSwapTime;
        this.r += this.colorSwapTime;
        if (this.b <= 0) {
          this.r = 255;
          this.b = 0;
          this.currentlyUpdating = "r";
        }
        break;
    }
    this.render(c, this.r, this.g, this.b, this.a);
  }

  logRGB() {
    console.log(this.r, this.g, this.b);
  }
}

function clearScreen(c: any) {
  c.clearRect(0, 0, innerWidth, innerHeight);
  c.fillStyle = "black";
  c.fillRect(0, 0, innerWidth, innerHeight);
}

export default function FlowField({}) {
  const flowFieldVectors: Vector2[][] = [[], []];
  const particles: Particle[] = [];

  useEffect(() => {
    if (!document.querySelector("canvas")) {
      setTimeout(() => {}, 100);
    }
    const canvas: HTMLCanvasElement = document.querySelector("canvas")!;
    const c = canvas.getContext("2d")!;

    canvas.width = innerWidth;
    canvas.height = innerHeight;
    let increment = 0.005;

    function generateParticles(
      particleCount: number = (canvas.width * canvas.height) / 1500
    ) {
      for (let i = 0; i < particleCount; i++) {
        particles.push(
          new Particle(
            Math.random() * innerWidth,
            Math.random() * innerHeight,
            Math.random(),
            Math.random(),
            2
          )
        );
      }
    }

    function generateFlowField(time: number = 0) {
      const columns = Math.floor(innerWidth / 30);
      let xOffset = 0;
      for (let x = 0; x < innerWidth; x += 30) {
        flowFieldVectors[x] = new Array<Vector2>(columns);
        let yOffset = 0;
        for (let y = 0; y < innerHeight; y += 30) {
          const noiseVal = noise(xOffset + time, yOffset + time) * Math.PI * 8;
          flowFieldVectors[x][y] = new Vector2(
            x,
            y,
            Math.cos(noiseVal) * 10,
            Math.sin(noiseVal) * 10
          );
          yOffset += increment;
        }
        xOffset += increment;
      }
    }

    function init() {
      generateParticles(500);
      generateFlowField();
    }

    init();
    let time = 0;
    clearScreen(c);

    function animate() {
      time += 0.000008;
      //clearScreen(c);
      //flowFieldVectors.forEach((vectorRow) => {
      //  vectorRow.forEach((vector) => {
      //    vector.render(c);
      //  });
      //});
      generateFlowField(time);
      particles.forEach((particle) => {
        particle.updatePosition(c, flowFieldVectors);
      });

      requestAnimationFrame(animate);
    }

    animate();
  }, []);

  return (
    <>
      <canvas></canvas>
    </>
  );
}
