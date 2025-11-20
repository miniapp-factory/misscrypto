"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { url, title } from "@/lib/metadata";

const GRID_SIZE = 4;
const TILE_VALUES = [2, 4];
const TILE_PROBABILITIES = [0.9, 0.1];

function getRandomTileValue() {
  return Math.random() < TILE_PROBABILITIES[0] ? TILE_VALUES[0] : TILE_VALUES[1];
}

function cloneGrid(grid: number[][]) {
  return grid.map(row => [...row]);
}

export function Game2048() {
  const [grid, setGrid] = useState<number[][]>(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const addRandomTile = useCallback(() => {
    const emptyCells: [number, number][] = [];
    grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell === 0) emptyCells.push([r, c]);
      });
    });
    if (emptyCells.length === 0) return;
    const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newGrid = cloneGrid(grid);
    newGrid[r][c] = getRandomTileValue();
    setGrid(newGrid);
  }, [grid]);

  const move = useCallback((direction: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    let moved = false;
    let newGrid = cloneGrid(grid);
    // const combine = (a: number, b: number) => (a === b && a !== 0 ? a + b : a);

    const slide = (line: number[]) => {
      const filtered = line.filter(v => v !== 0);
      const merged: number[] = [];
      let skip = false;
      for (let i = 0; i < filtered.length; i++) {
        if (skip) { skip = false; continue; }
        if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
          merged.push(filtered[i] * 2);
          skip = true;
        } else {
          merged.push(filtered[i]);
        }
      }
      while (merged.length < GRID_SIZE) merged.push(0);
      return merged;
    };

    const transpose = (m: number[][]) => m[0].map((_, i) => m.map(row => row[i]));

    if (direction === "left") {
      for (let r = 0; r < GRID_SIZE; r++) {
        const line = newGrid[r];
        const newLine = slide(line);
        if (!moved && !newLine.every((v, i) => v === line[i])) moved = true;
        newGrid[r] = newLine;
      }
    } else if (direction === "right") {
      for (let r = 0; r < GRID_SIZE; r++) {
        const line = [...newGrid[r]].reverse();
        const newLine = slide(line).reverse();
        if (!moved && !newLine.every((v, i) => v === newGrid[r][i])) moved = true;
        newGrid[r] = newLine;
      }
    } else if (direction === "up") {
      newGrid = transpose(newGrid);
      for (let r = 0; r < GRID_SIZE; r++) {
        const line = newGrid[r];
        const newLine = slide(line);
        if (!moved && !newLine.every((v, i) => v === line[i])) moved = true;
        newGrid[r] = newLine;
      }
      newGrid = transpose(newGrid);
    } else if (direction === "down") {
      newGrid = transpose(newGrid);
      for (let r = 0; r < GRID_SIZE; r++) {
        const line = [...newGrid[r]].reverse();
        const newLine = slide(line).reverse();
        if (!moved && !newLine.every((v, i) => v === newGrid[r][i])) moved = true;
        newGrid[r] = newLine;
      }
      newGrid = transpose(newGrid);
    }

    if (moved) {
      setGrid(newGrid);
      const addedScore = newGrid.flat().reduce((acc, val, idx, arr) => {
        const prev = arr[idx - GRID_SIZE] ?? 0;
        return acc + (val > prev ? val - prev : 0);
      }, 0);
      setScore(prev => prev + addedScore);
      addRandomTile();
      if (newGrid.flat().includes(2048)) setGameWon(true);
      if (!newGrid.flat().some(v => v === 0) && !hasMoves(newGrid)) setGameOver(true);
    }
  }, [grid, gameOver, addRandomTile]);

  const hasMoves = (g: number[][]) => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (g[r][c] === 0) return true;
        if (c + 1 < GRID_SIZE && g[r][c] === g[r][c + 1]) return true;
        if (r + 1 < GRID_SIZE && g[r][c] === g[r + 1][c]) return true;
      }
    }
    return false;
  };

  useEffect(() => {
    addRandomTile();
    addRandomTile();
  }, [addRandomTile]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        move("up");
        break;
      case "ArrowDown":
        move("down");
        break;
      case "ArrowLeft":
        move("left");
        break;
      case "ArrowRight":
        move("right");
        break;
    }
  }, [move]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {grid.flat().map((val, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-center h-16 w-16 rounded-md text-2xl font-bold ${
              val === 0
                ? "bg-muted"
                : val <= 4
                ? "bg-primary text-primary-foreground"
                : val <= 8
                ? "bg-secondary text-secondary-foreground"
                : val <= 16
                ? "bg-accent text-accent-foreground"
                : "bg-destructive text-destructive-foreground"
            }`}
          >
            {val !== 0 ? val : null}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => move("up")}>↑</Button>
        <Button onClick={() => move("left")}>←</Button>
        <Button onClick={() => move("right")}>→</Button>
        <Button onClick={() => move("down")}>↓</Button>
      </div>
      <div className="text-xl">Score: {score}</div>
      {(gameOver || gameWon) && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-2xl font-bold">
            {gameWon ? "You Win!" : "Game Over"}
          </div>
          <Share text={`${title} ${url} Score: ${score}`} />
        </div>
      )}
    </div>
  );
}
