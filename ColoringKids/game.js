/* ============================================================
   Coloring for Kids – game.js
   PlayMixGames · 2026
   ============================================================ */

'use strict';

// ── COLOUR PALETTE ─────────────────────────────────────────
const PALETTE = [
  { hex: '#FF4444', name: 'Red' },
  { hex: '#FF8C00', name: 'Orange' },
  { hex: '#FFD700', name: 'Yellow' },
  { hex: '#FF69B4', name: 'Pink' },
  { hex: '#FF1493', name: 'Hot Pink' },
  { hex: '#9B59B6', name: 'Purple' },
  { hex: '#3498DB', name: 'Blue' },
  { hex: '#00BFFF', name: 'Sky Blue' },
  { hex: '#2ECC71', name: 'Green' },
  { hex: '#27AE60', name: 'Dark Green' },
  { hex: '#1ABC9C', name: 'Teal' },
  { hex: '#E74C3C', name: 'Crimson' },
  { hex: '#F39C12', name: 'Amber' },
  { hex: '#E67E22', name: 'Pumpkin' },
  { hex: '#8E44AD', name: 'Violet' },
  { hex: '#2980B9', name: 'Ocean' },
  { hex: '#16A085', name: 'Emerald' },
  { hex: '#D35400', name: 'Burnt' },
  { hex: '#7F8C8D', name: 'Grey' },
  { hex: '#34495E', name: 'Dark' },
  { hex: '#ECF0F1', name: 'Light', white: true },
  { hex: '#FFFFFF', name: 'White', white: true },
  { hex: '#000000', name: 'Black' },
  { hex: '#8B4513', name: 'Brown' },
  { hex: '#F5CBA7', name: 'Skin' },
  { hex: '#FFDAB9', name: 'Peach' },
];

// ── PICTURE LIBRARY ────────────────────────────────────────
// Each picture is a set of SVG paths with fill zones.
// For "color" mode we render outlines + fill regions.
// viewBox is 0 0 400 400.

const PICTURES = {
  animals: [
    {
      id: 'cat', name: 'Happy Cat', emoji: '🐱',
      paths: [
        // body
        { d: 'M120,300 Q120,200 200,180 Q280,200 280,300 Q280,360 200,370 Q120,360 120,300 Z', fill: '#FFA500', label: 'body' },
        // left ear
        { d: 'M140,200 L120,130 L180,170 Z', fill: '#FF8C00', label: 'ear-l' },
        // right ear
        { d: 'M260,200 L280,130 L220,170 Z', fill: '#FF8C00', label: 'ear-r' },
        // face circle
        { d: 'M150,230 Q200,210 250,230 Q270,260 250,290 Q200,310 150,290 Q130,260 150,230 Z', fill: '#FFD580', label: 'face' },
        // left eye
        { d: 'M168,255 A10,12 0 1,1 167.9,255 Z', fill: '#2ECC71', label: 'eye-l' },
        // right eye
        { d: 'M232,255 A10,12 0 1,1 231.9,255 Z', fill: '#2ECC71', label: 'eye-r' },
        // nose
        { d: 'M195,272 L205,272 L200,278 Z', fill: '#FF69B4', label: 'nose' },
        // tail
        { d: 'M280,310 Q340,300 350,260 Q360,220 330,210', fill: 'none', stroke: '#FFA500', sw: 14, label: 'tail', isStroke: true },
      ],
      outlineColor: '#333',
    },
    {
      id: 'dog', name: 'Cute Dog', emoji: '🐶',
      paths: [
        { d: 'M110,290 Q110,200 200,185 Q290,200 290,290 Q290,360 200,370 Q110,360 110,290 Z', fill: '#C68642', label: 'body' },
        { d: 'M125,220 Q80,160 100,120 Q130,140 145,195 Z', fill: '#A0522D', label: 'ear-l' },
        { d: 'M275,220 Q320,160 300,120 Q270,140 255,195 Z', fill: '#A0522D', label: 'ear-r' },
        { d: 'M155,230 Q200,215 245,230 Q260,255 245,280 Q200,295 155,280 Q140,255 155,230 Z', fill: '#F5DEB3', label: 'face' },
        { d: 'M172,252 A9,10 0 1,1 171.9,252 Z', fill: '#4A4A4A', label: 'eye-l' },
        { d: 'M228,252 A9,10 0 1,1 227.9,252 Z', fill: '#4A4A4A', label: 'eye-r' },
        { d: 'M180,270 Q200,285 220,270 Q210,295 200,295 Q190,295 180,270 Z', fill: '#FF69B4', label: 'snout' },
        { d: 'M196,278 L204,278 L200,284 Z', fill: '#333', label: 'nose' },
      ],
      outlineColor: '#333',
    },
    {
      id: 'lion', name: 'Lion King', emoji: '🦁',
      paths: [
        { d: 'M90,320 Q90,220 200,200 Q310,220 310,320 Q310,370 200,375 Q90,370 90,320 Z', fill: '#F5A623', label: 'mane' },
        { d: 'M145,270 Q200,245 255,270 Q275,300 255,325 Q200,340 145,325 Q125,300 145,270 Z', fill: '#FFD700', label: 'face' },
        { d: 'M162,285 A9,10 0 1,1 161.9,285 Z', fill: '#6B4226', label: 'eye-l' },
        { d: 'M238,285 A9,10 0 1,1 237.9,285 Z', fill: '#6B4226', label: 'eye-r' },
        { d: 'M185,305 Q200,315 215,305 Q210,325 200,325 Q190,325 185,305 Z', fill: '#F5A0A0', label: 'snout' },
        { d: 'M196,310 L204,310 L200,316 Z', fill: '#333', label: 'nose' },
        { d: 'M310,280 Q360,270 355,230', fill: 'none', stroke: '#F5A623', sw: 12, label: 'tail', isStroke: true },
      ],
      outlineColor: '#7B5E3B',
    },
    {
      id: 'elephant', name: 'Elephant', emoji: '🐘',
      paths: [
        { d: 'M100,310 Q100,220 200,200 Q300,220 300,310 Q300,365 200,370 Q100,365 100,310 Z', fill: '#9E9E9E', label: 'body' },
        { d: 'M100,240 Q50,220 55,280 Q70,300 100,290 Z', fill: '#BDBDBD', label: 'ear-l' },
        { d: 'M300,240 Q350,220 345,280 Q330,300 300,290 Z', fill: '#BDBDBD', label: 'ear-r' },
        { d: 'M160,280 Q200,260 240,280 Q255,305 240,325 Q200,340 160,325 Q145,305 160,280 Z', fill: '#BDBDBD', label: 'face' },
        { d: 'M170,295 A8,9 0 1,1 169.9,295 Z', fill: '#333', label: 'eye-l' },
        { d: 'M230,295 A8,9 0 1,1 229.9,295 Z', fill: '#333', label: 'eye-r' },
        { d: 'M190,320 Q200,380 185,400 Q195,405 205,400 Q215,380 210,320 Z', fill: '#9E9E9E', label: 'trunk' },
      ],
      outlineColor: '#555',
    },
    {
      id: 'rabbit', name: 'Bunny', emoji: '🐰',
      paths: [
        { d: 'M130,290 Q130,210 200,195 Q270,210 270,290 Q270,355 200,360 Q130,355 130,290 Z', fill: '#FFB7C5', label: 'body' },
        { d: 'M155,210 Q145,140 165,110 Q175,140 175,210 Z', fill: '#FFB7C5', label: 'ear-l' },
        { d: 'M245,210 Q255,140 235,110 Q225,140 225,210 Z', fill: '#FFB7C5', label: 'ear-r' },
        { d: 'M160,115 Q155,130 165,160 Q175,130 165,115 Z', fill: '#FF8FAB', label: 'inner-ear-l' },
        { d: 'M240,115 Q245,130 235,160 Q225,130 235,115 Z', fill: '#FF8FAB', label: 'inner-ear-r' },
        { d: 'M155,240 Q200,225 245,240 Q260,260 245,285 Q200,295 155,285 Q140,260 155,240 Z', fill: '#FFF0F5', label: 'face' },
        { d: 'M172,257 A8,9 0 1,1 171.9,257 Z', fill: '#333', label: 'eye-l' },
        { d: 'M228,257 A8,9 0 1,1 227.9,257 Z', fill: '#333', label: 'eye-r' },
        { d: 'M196,270 L204,270 L200,276 Z', fill: '#FF8FAB', label: 'nose' },
      ],
      outlineColor: '#C47B9B',
    },
    {
      id: 'bird', name: 'Tweety Bird', emoji: '🐦',
      paths: [
        { d: 'M140,290 Q140,220 200,200 Q260,220 260,290 Q260,350 200,355 Q140,350 140,290 Z', fill: '#FFD700', label: 'body' },
        { d: 'M160,200 Q170,150 195,160 Q200,175 200,200 Z', fill: '#FFD700', label: 'wing-l' },
        { d: 'M240,200 Q230,150 205,160 Q200,175 200,200 Z', fill: '#FFD700', label: 'wing-r' },
        { d: 'M170,255 Q200,240 230,255 Q240,270 230,285 Q200,292 170,285 Q160,270 170,255 Z', fill: '#FFFDE7', label: 'face' },
        { d: 'M180,263 A7,8 0 1,1 179.9,263 Z', fill: '#1E88E5', label: 'eye-l' },
        { d: 'M220,263 A7,8 0 1,1 219.9,263 Z', fill: '#1E88E5', label: 'eye-r' },
        { d: 'M188,278 L212,278 L208,288 L192,288 Z', fill: '#FF8C00', label: 'beak' },
        { d: 'M195,355 L190,380 L200,385 L210,380 L205,355 Z', fill: '#FF8C00', label: 'feet' },
      ],
      outlineColor: '#E6B800',
    },
  ],

  dinos: [
    {
      id: 'trex', name: 'T-Rex', emoji: '🦖',
      paths: [
        { d: 'M80,330 Q80,230 180,210 Q260,210 290,250 Q330,240 350,270 Q370,300 330,310 Q340,350 300,360 Q280,340 260,360 Q240,380 200,370 Q150,380 120,360 Q80,380 80,330 Z', fill: '#4CAF50', label: 'body' },
        { d: 'M260,210 Q300,160 340,155 Q360,180 340,220 Q310,225 290,250 Z', fill: '#388E3C', label: 'head' },
        { d: 'M295,165 Q300,130 330,125 Q335,145 310,165 Z', fill: '#66BB6A', label: 'top-spike' },
        { d: 'M310,155 Q325,125 345,128 Q345,150 320,158 Z', fill: '#66BB6A', label: 'top-spike2' },
        { d: 'M330,175 Q310,175 305,185 Q315,200 335,190 Z', fill: '#FFFFFF', label: 'teeth-top' },
        { d: 'M310,185 Q320,200 330,190 Q335,200 320,210 Z', fill: '#FFFFFF', label: 'teeth-bot' },
        { d: 'M340,195 A8,10 0 1,1 339.9,195 Z', fill: '#F44336', label: 'eye' },
        { d: 'M180,250 Q160,260 155,285 Q165,290 185,275 Z', fill: '#388E3C', label: 'arm-l' },
        { d: 'M100,310 Q60,340 50,380 Q70,380 90,345 Z', fill: '#4CAF50', label: 'tail' },
        { d: 'M255,350 Q245,390 235,400 Q250,405 265,395 L270,355 Z', fill: '#388E3C', label: 'leg-l' },
        { d: 'M285,355 Q280,395 270,405 Q285,410 298,398 L302,355 Z', fill: '#388E3C', label: 'leg-r' },
        { d: 'M118,340 Q126,360 140,355 Q148,340 135,325 Z', fill: '#4CAF50', label: 'leg-back' },
      ],
      outlineColor: '#1B5E20',
    },
    {
      id: 'stego', name: 'Stegosaurus', emoji: '🦕',
      paths: [
        { d: 'M60,310 Q80,230 170,225 Q260,215 310,250 Q340,275 330,320 Q310,355 250,360 Q200,370 150,360 Q90,365 60,310 Z', fill: '#66BB6A', label: 'body' },
        { d: 'M310,250 Q345,225 370,230 Q385,255 365,275 Q345,285 330,280 Z', fill: '#4CAF50', label: 'head' },
        { d: 'M355,238 A6,8 0 1,1 354.9,238 Z', fill: '#F44336', label: 'eye' },
        { d: 'M370,255 L385,250 L385,265 Z', fill: '#FFFFFF', label: 'teeth' },
        // back plates
        { d: 'M130,225 Q125,180 140,160 Q150,180 148,225 Z', fill: '#F44336', label: 'plate1' },
        { d: 'M165,220 Q160,170 178,145 Q188,170 183,220 Z', fill: '#FF9800', label: 'plate2' },
        { d: 'M200,218 Q195,165 215,140 Q225,165 220,218 Z', fill: '#FFD700', label: 'plate3' },
        { d: 'M235,220 Q232,168 250,148 Q260,168 255,220 Z', fill: '#FF9800', label: 'plate4' },
        { d: 'M265,228 Q265,185 280,168 Q288,188 282,228 Z', fill: '#F44336', label: 'plate5' },
        { d: 'M150,345 L140,390 L158,392 L163,345 Z', fill: '#4CAF50', label: 'leg1' },
        { d: 'M205,350 L198,395 L216,396 L218,350 Z', fill: '#4CAF50', label: 'leg2' },
        { d: 'M245,348 L240,393 L258,394 L258,348 Z', fill: '#388E3C', label: 'leg3' },
        { d: 'M290,340 L288,385 L306,386 L304,340 Z', fill: '#388E3C', label: 'leg4' },
        { d: 'M60,310 Q20,320 15,355 Q40,360 65,340 Z', fill: '#66BB6A', label: 'tail' },
      ],
      outlineColor: '#1B5E20',
    },
    {
      id: 'tricera', name: 'Triceratops', emoji: '🦏',
      paths: [
        { d: 'M90,310 Q100,225 200,210 Q290,215 310,270 Q330,300 310,345 Q280,370 200,370 Q120,375 90,310 Z', fill: '#8BC34A', label: 'body' },
        { d: 'M310,270 Q350,240 380,250 Q395,275 380,300 Q360,315 335,305 Z', fill: '#7CB342', label: 'head' },
        { d: 'M360,240 Q370,205 385,200 Q390,225 375,245 Z', fill: '#C8E6C9', label: 'frill-t' },
        { d: 'M345,242 Q345,205 360,200 Q368,224 358,244 Z', fill: '#A5D6A7', label: 'frill-l' },
        { d: 'M360,245 L390,230 Q400,245 388,260 Z', fill: '#C8E6C9', label: 'frill-r' },
        { d: 'M375,248 Q385,220 395,222 L388,248 Z', fill: '#EF9A9A', label: 'horn-nose' },
        { d: 'M360,238 Q370,210 378,212 L373,240 Z', fill: '#EF9A9A', label: 'horn-l' },
        { d: 'M348,238 Q355,212 362,215 L358,240 Z', fill: '#EF9A9A', label: 'horn-r' },
        { d: 'M372,270 A7,8 0 1,1 371.9,270 Z', fill: '#333', label: 'eye' },
        { d: 'M155,340 L148,385 L165,386 L168,340 Z', fill: '#7CB342', label: 'leg-fl' },
        { d: 'M205,345 L200,390 L217,390 L218,345 Z', fill: '#7CB342', label: 'leg-fr' },
        { d: 'M258,343 L254,388 L271,388 L271,343 Z', fill: '#689F38', label: 'leg-bl' },
        { d: 'M293,340 L291,385 L308,385 L305,340 Z', fill: '#689F38', label: 'leg-br' },
        { d: 'M90,310 Q50,315 42,350 Q65,360 92,335 Z', fill: '#8BC34A', label: 'tail' },
      ],
      outlineColor: '#33691E',
    },
    {
      id: 'ptero', name: 'Pterodactyl', emoji: '🦅',
      paths: [
        { d: 'M160,270 Q200,250 240,270 Q260,300 240,330 Q200,345 160,330 Q140,300 160,270 Z', fill: '#CE93D8', label: 'body' },
        { d: 'M240,270 Q290,240 325,245 Q340,265 320,285 Q300,295 270,285 Z', fill: '#BA68C8', label: 'head' },
        { d: 'M300,240 Q315,205 335,200 Q335,225 315,248 Z', fill: '#AB47BC', label: 'beak' },
        { d: 'M315,255 A7,8 0 1,1 314.9,255 Z', fill: '#333', label: 'eye' },
        { d: 'M160,280 Q80,230 40,200 Q50,240 100,265 Q130,275 160,300 Z', fill: '#CE93D8', label: 'wing-l' },
        { d: 'M240,280 Q320,230 360,200 Q350,240 300,265 Q270,275 240,300 Z', fill: '#CE93D8', label: 'wing-r' },
        { d: 'M200,330 Q195,365 190,380 Q205,385 210,380 Q205,365 200,340 Z', fill: '#AB47BC', label: 'leg-l' },
        { d: 'M200,330 Q205,365 210,380 Q215,385 220,378 Q214,365 204,340 Z', fill: '#AB47BC', label: 'leg-r' },
        { d: 'M200,260 Q200,220 210,195 Q215,220 210,265 Z', fill: '#CE93D8', label: 'crest' },
      ],
      outlineColor: '#6A1B9A',
    },
  ],

  cars: [
    {
      id: 'racecar', name: 'Race Car', emoji: '🏎️',
      paths: [
        { d: 'M50,270 Q55,230 100,220 L300,220 Q345,230 350,270 L340,310 Q200,320 60,310 Z', fill: '#F44336', label: 'body' },
        { d: 'M110,220 Q120,180 180,170 L250,170 Q290,178 300,220 Z', fill: '#E53935', label: 'roof' },
        { d: 'M120,175 L140,175 L130,190 L110,225 Z', fill: '#90CAF9', label: 'window-l' },
        { d: 'M145,175 L245,175 L250,190 L140,193 Z', fill: '#90CAF9', label: 'windshield' },
        { d: 'M250,175 L260,175 L295,220 L268,193 Z', fill: '#90CAF9', label: 'window-r' },
        { d: 'M90,300 A38,38 0 1,1 89.9,300 Z', fill: '#333', label: 'wheel-l' },
        { d: 'M310,300 A38,38 0 1,1 309.9,300 Z', fill: '#333', label: 'wheel-r' },
        { d: 'M90,300 A22,22 0 1,1 89.9,300 Z', fill: '#9E9E9E', label: 'hub-l' },
        { d: 'M310,300 A22,22 0 1,1 309.9,300 Z', fill: '#9E9E9E', label: 'hub-r' },
        { d: 'M50,260 Q30,260 28,275 Q28,290 50,285 Z', fill: '#FFEB3B', label: 'light-l' },
        { d: 'M350,260 Q370,260 372,275 Q372,290 350,285 Z', fill: '#FFEB3B', label: 'light-r' },
        { d: 'M140,230 L160,230 L160,248 L140,248 Z', fill: '#1565C0', label: 'stripe' },
        { d: 'M240,230 L260,230 L260,248 L240,248 Z', fill: '#1565C0', label: 'stripe2' },
      ],
      outlineColor: '#B71C1C',
    },
    {
      id: 'truck', name: 'Big Truck', emoji: '🚚',
      paths: [
        { d: 'M40,260 L40,310 L380,310 L380,220 L260,220 L260,260 Z', fill: '#2196F3', label: 'trailer' },
        { d: 'M40,220 L40,260 L260,260 L260,220 Q240,185 200,180 L80,180 Q50,185 40,220 Z', fill: '#1976D2', label: 'cab' },
        { d: 'M55,190 L55,220 L140,220 L140,190 Q130,178 100,176 Q70,177 55,190 Z', fill: '#90CAF9', label: 'windshield' },
        { d: 'M150,190 L145,220 L220,220 L220,198 Q200,185 165,185 Z', fill: '#BBDEFB', label: 'side-window' },
        { d: 'M40,260 L40,285 Q42,292 50,292 Q58,292 60,285 L60,260 Z', fill: '#555', label: 'step' },
        { d: 'M100,300 A35,35 0 1,1 99.9,300 Z', fill: '#222', label: 'wheel-fl' },
        { d: 'M195,300 A35,35 0 1,1 194.9,300 Z', fill: '#222', label: 'wheel-fr' },
        { d: 'M285,300 A35,35 0 1,1 284.9,300 Z', fill: '#222', label: 'wheel-bl' },
        { d: 'M355,300 A35,35 0 1,1 354.9,300 Z', fill: '#222', label: 'wheel-br' },
        { d: 'M100,300 A20,20 0 1,1 99.9,300 Z', fill: '#AAA', label: 'hub-fl' },
        { d: 'M195,300 A20,20 0 1,1 194.9,300 Z', fill: '#AAA', label: 'hub-fr' },
        { d: 'M285,300 A20,20 0 1,1 284.9,300 Z', fill: '#AAA', label: 'hub-bl' },
        { d: 'M355,300 A20,20 0 1,1 354.9,300 Z', fill: '#AAA', label: 'hub-br' },
        { d: 'M40,230 Q25,230 22,245 Q22,258 40,255 Z', fill: '#FFEB3B', label: 'headlight' },
      ],
      outlineColor: '#0D47A1',
    },
    {
      id: 'rocket', name: 'Rocket Ship', emoji: '🚀',
      paths: [
        { d: 'M200,50 Q160,80 140,160 L140,320 Q200,340 260,320 L260,160 Q240,80 200,50 Z', fill: '#F44336', label: 'body' },
        { d: 'M200,50 Q175,80 172,140 Q200,148 228,140 Q225,80 200,50 Z', fill: '#FFFFFF', label: 'nose' },
        { d: 'M140,200 Q80,220 65,260 Q100,270 140,250 Z', fill: '#1565C0', label: 'fin-l' },
        { d: 'M260,200 Q320,220 335,260 Q300,270 260,250 Z', fill: '#1565C0', label: 'fin-r' },
        { d: 'M165,165 Q200,155 235,165 L235,195 Q200,205 165,195 Z', fill: '#90CAF9', label: 'window' },
        { d: 'M200,175 A16,16 0 1,1 199.9,175 Z', fill: '#E3F2FD', label: 'port' },
        { d: 'M155,315 Q125,345 130,380 Q165,380 160,340 Z', fill: '#FF9800', label: 'flame-l' },
        { d: 'M200,320 Q190,360 200,395 Q210,360 200,320 Z', fill: '#FFEB3B', label: 'flame-m' },
        { d: 'M245,315 Q275,345 270,380 Q235,380 240,340 Z', fill: '#FF9800', label: 'flame-r' },
        { d: 'M175,230 L180,230 L180,290 L175,290 Z', fill: '#FFFFFF', label: 'stripe-l' },
        { d: 'M220,230 L225,230 L225,290 L220,290 Z', fill: '#FFFFFF', label: 'stripe-r' },
      ],
      outlineColor: '#B71C1C',
    },
    {
      id: 'schoolbus', name: 'School Bus', emoji: '🚌',
      paths: [
        { d: 'M30,230 L30,300 Q32,315 50,316 L370,316 Q388,315 390,300 L390,230 Q388,215 370,214 L50,214 Q32,215 30,230 Z', fill: '#FFD600', label: 'body' },
        { d: 'M50,214 L50,260 L155,260 L155,214 Z', fill: '#90CAF9', label: 'window-1' },
        { d: 'M165,214 L165,260 L255,260 L255,214 Z', fill: '#90CAF9', label: 'window-2' },
        { d: 'M265,214 L265,260 L355,260 L355,214 Z', fill: '#90CAF9', label: 'window-3' },
        { d: 'M30,230 Q20,230 18,248 Q18,268 30,265 Z', fill: '#FFEB3B', label: 'headlight-f' },
        { d: 'M390,230 Q402,230 403,248 Q403,268 390,265 Z', fill: '#FFEB3B', label: 'headlight-b' },
        { d: 'M95,305 A32,32 0 1,1 94.9,305 Z', fill: '#222', label: 'wheel-l' },
        { d: 'M305,305 A32,32 0 1,1 304.9,305 Z', fill: '#222', label: 'wheel-r' },
        { d: 'M95,305 A18,18 0 1,1 94.9,305 Z', fill: '#AAA', label: 'hub-l' },
        { d: 'M305,305 A18,18 0 1,1 304.9,305 Z', fill: '#AAA', label: 'hub-r' },
        { d: 'M30,270 L390,270 L390,280 L30,280 Z', fill: '#E65100', label: 'stripe' },
        { d: 'M140,275 L155,265 L155,285 Z', fill: '#333', label: 'door-mark' },
      ],
      outlineColor: '#E65100',
    },
  ],

  ocean: [
    {
      id: 'fish', name: 'Clown Fish', emoji: '🐠',
      paths: [
        { d: 'M80,200 Q100,150 200,165 Q300,150 320,200 Q300,250 200,265 Q100,250 80,200 Z', fill: '#FF8C00', label: 'body' },
        { d: 'M320,200 Q365,165 370,200 Q365,235 320,200 Z', fill: '#FF6B00', label: 'tail' },
        { d: 'M120,168 L130,200 L120,232 Q115,200 120,168 Z', fill: '#FFFFFF', label: 'stripe-1' },
        { d: 'M195,163 L205,200 L195,237 Q188,200 195,163 Z', fill: '#FFFFFF', label: 'stripe-2' },
        { d: 'M268,170 L278,200 L268,230 Q260,200 268,170 Z', fill: '#FFFFFF', label: 'stripe-3' },
        { d: 'M105,185 A10,12 0 1,1 104.9,185 Z', fill: '#333', label: 'eye' },
        { d: 'M200,195 Q200,175 200,155', fill: 'none', stroke: '#FF6B00', sw: 6, label: 'fin-top', isStroke: true },
        { d: 'M200,205 Q200,225 200,240', fill: 'none', stroke: '#FF6B00', sw: 6, label: 'fin-bot', isStroke: true },
        { d: 'M80,200 Q50,185 40,200 Q50,215 80,200 Z', fill: '#FF6B00', label: 'mouth' },
      ],
      outlineColor: '#E65100',
    },
    {
      id: 'dolphin', name: 'Dolphin', emoji: '🐬',
      paths: [
        { d: 'M60,240 Q90,190 200,195 Q320,185 360,230 Q340,265 280,270 Q240,278 180,268 Q130,275 90,268 Q60,268 60,240 Z', fill: '#4FC3F7', label: 'body' },
        { d: 'M360,230 Q390,215 410,235 Q390,258 360,250 Z', fill: '#4FC3F7', label: 'nose' },
        { d: 'M90,270 Q80,310 60,325 Q75,310 85,285 Z', fill: '#29B6F6', label: 'tail-l' },
        { d: 'M90,270 Q70,295 50,300 Q65,285 80,265 Z', fill: '#29B6F6', label: 'tail-r' },
        { d: 'M200,193 Q220,155 250,150 Q260,175 230,195 Z', fill: '#4FC3F7', label: 'dorsal' },
        { d: 'M200,250 Q160,270 130,265 Q160,255 200,240 Z', fill: '#81D4FA', label: 'belly' },
        { d: 'M360,228 A10,11 0 1,1 359.9,228 Z', fill: '#333', label: 'eye' },
        { d: 'M180,220 Q180,205 180,193', fill: 'none', stroke: '#0288D1', sw: 5, label: 'flipper', isStroke: true },
      ],
      outlineColor: '#01579B',
    },
    {
      id: 'octopus', name: 'Octopus', emoji: '🐙',
      paths: [
        { d: 'M140,150 Q200,110 260,150 Q290,185 270,220 Q240,245 200,248 Q160,245 130,220 Q110,185 140,150 Z', fill: '#E91E63', label: 'head' },
        { d: 'M140,230 Q120,280 105,310 Q115,320 125,310 Q130,285 145,250 Z', fill: '#E91E63', label: 'tentacle-1' },
        { d: 'M165,242 Q155,295 150,330 Q162,335 170,328 Q168,295 175,248 Z', fill: '#C2185B', label: 'tentacle-2' },
        { d: 'M195,248 Q195,302 195,338 Q207,338 210,330 Q207,300 200,248 Z', fill: '#E91E63', label: 'tentacle-3' },
        { d: 'M225,242 Q235,295 240,330 Q252,328 254,320 Q244,295 228,248 Z', fill: '#C2185B', label: 'tentacle-4' },
        { d: 'M250,230 Q275,280 285,312 Q296,308 296,298 Q278,273 255,246 Z', fill: '#E91E63', label: 'tentacle-5' },
        { d: 'M175,165 A14,16 0 1,1 174.9,165 Z', fill: '#FFFFFF', label: 'eye-l' },
        { d: 'M225,165 A14,16 0 1,1 224.9,165 Z', fill: '#FFFFFF', label: 'eye-r' },
        { d: 'M178,165 A7,8 0 1,1 177.9,165 Z', fill: '#333', label: 'pupil-l' },
        { d: 'M228,165 A7,8 0 1,1 227.9,165 Z', fill: '#333', label: 'pupil-r' },
        { d: 'M192,190 Q200,200 208,190 Q204,205 200,205 Q196,205 192,190 Z', fill: '#F48FB1', label: 'mouth' },
      ],
      outlineColor: '#880E4F',
    },
    {
      id: 'whale', name: 'Blue Whale', emoji: '🐋',
      paths: [
        { d: 'M50,220 Q80,175 200,180 Q330,170 370,215 Q360,255 310,270 Q260,285 200,280 Q140,285 90,270 Q50,258 50,220 Z', fill: '#1976D2', label: 'body' },
        { d: 'M50,230 Q20,240 18,255 Q25,270 55,260 Z', fill: '#1565C0', label: 'mouth' },
        { d: 'M370,215 Q400,195 415,215 Q400,238 370,232 Z', fill: '#1565C0', label: 'tail-fin' },
        { d: 'M370,222 Q395,245 388,260 Q370,255 370,240 Z', fill: '#1565C0', label: 'tail-fin2' },
        { d: 'M230,178 Q240,135 270,125 Q275,155 250,180 Z', fill: '#1976D2', label: 'dorsal' },
        { d: 'M200,255 Q140,275 100,268 Q150,255 200,245 Z', fill: '#90CAF9', label: 'belly' },
        { d: 'M90,205 A10,12 0 1,1 89.9,205 Z', fill: '#333', label: 'eye' },
        { d: 'M200,170 Q200,155 202,145 Q205,155 204,170 Z', fill: '#BBDEFB', label: 'spout' },
        { d: 'M195,148 Q190,130 185,118 Q192,128 200,145 Q205,130 210,115 Q215,128 205,148 Z', fill: '#90CAF9', label: 'water-spout' },
      ],
      outlineColor: '#0D47A1',
    },
  ],

  fantasy: [
    {
      id: 'unicorn', name: 'Unicorn', emoji: '🦄',
      paths: [
        { d: 'M120,295 Q120,210 200,195 Q280,210 280,295 Q280,355 200,362 Q120,355 120,295 Z', fill: '#F8BBD9', label: 'body' },
        { d: 'M200,195 Q260,165 285,180 Q295,210 270,235 Q240,245 220,230 Z', fill: '#FCE4EC', label: 'head' },
        { d: 'M265,168 Q275,130 290,120 Q298,148 278,172 Z', fill: '#CE93D8', label: 'horn' },
        { d: 'M270,135 Q282,118 292,122 Q285,140 274,148 Z', fill: '#E1BEE7', label: 'horn-shine' },
        { d: 'M220,196 Q230,155 248,140 Q255,165 238,198 Z', fill: '#FF80AB', label: 'ear' },
        { d: 'M250,195 A9,10 0 1,1 249.9,195 Z', fill: '#7C4DFF', label: 'eye' },
        { d: 'M253,192 A4,5 0 1,1 252.9,192 Z', fill: '#FFFFFF', label: 'eye-shine' },
        { d: 'M220,215 Q240,218 255,212 Q245,225 232,226 Z', fill: '#FF80AB', label: 'nostril' },
        // mane
        { d: 'M215,195 Q200,170 185,155 Q190,170 195,190 Z', fill: '#FF4081', label: 'mane-1' },
        { d: 'M205,195 Q188,172 175,160 Q182,175 188,194 Z', fill: '#E040FB', label: 'mane-2' },
        { d: 'M196,198 Q178,177 166,168 Q174,182 182,198 Z', fill: '#40C4FF', label: 'mane-3' },
        // legs
        { d: 'M150,345 L144,392 L160,393 L163,345 Z', fill: '#F8BBD9', label: 'leg-fl' },
        { d: 'M200,348 L196,395 L212,395 L214,348 Z', fill: '#F8BBD9', label: 'leg-fr' },
        { d: 'M248,345 L244,393 L260,393 L260,345 Z', fill: '#F8BBD9', label: 'leg-bl' },
        // tail
        { d: 'M120,310 Q80,295 70,270 Q85,280 100,300 Z', fill: '#FF4081', label: 'tail-1' },
        { d: 'M120,318 Q72,315 62,290 Q80,295 105,315 Z', fill: '#E040FB', label: 'tail-2' },
        { d: 'M120,326 Q75,335 68,314 Q86,312 112,328 Z', fill: '#40C4FF', label: 'tail-3' },
      ],
      outlineColor: '#AD1457',
    },
    {
      id: 'dragon', name: 'Baby Dragon', emoji: '🐲',
      paths: [
        { d: 'M130,295 Q125,220 200,205 Q275,215 275,295 Q275,360 200,365 Q128,360 130,295 Z', fill: '#66BB6A', label: 'body' },
        { d: 'M200,205 Q245,175 265,188 Q278,210 258,232 Q235,240 215,228 Z', fill: '#81C784', label: 'head' },
        { d: 'M233,215 A9,10 0 1,1 232.9,215 Z', fill: '#F44336', label: 'eye' },
        { d: 'M235,212 A4,5 0 1,1 234.9,212 Z', fill: '#FFFFFF', label: 'eye-shine' },
        { d: 'M248,222 Q260,225 268,220 Q265,230 255,232 Z', fill: '#A5D6A7', label: 'nostril' },
        { d: 'M255,230 Q275,240 282,235 Q278,248 268,248 Z', fill: '#FFEB3B', label: 'flame' },
        { d: 'M267,236 Q288,243 292,235 Q292,250 280,252 Z', fill: '#FF9800', label: 'flame-2' },
        { d: 'M220,205 Q228,165 240,150 Q246,170 232,208 Z', fill: '#4CAF50', label: 'horn-l' },
        { d: 'M230,202 Q240,165 252,152 Q256,172 242,205 Z', fill: '#388E3C', label: 'horn-r' },
        { d: 'M275,255 Q310,235 330,250 Q320,275 290,268 Z', fill: '#4CAF50', label: 'wing-r' },
        { d: 'M125,255 Q90,235 70,250 Q80,275 110,268 Z', fill: '#4CAF50', label: 'wing-l' },
        { d: 'M155,345 L148,390 L164,390 L167,345 Z', fill: '#66BB6A', label: 'leg-l' },
        { d: 'M248,345 L244,390 L260,390 L260,345 Z', fill: '#66BB6A', label: 'leg-r' },
        { d: 'M275,290 Q315,280 330,255 Q340,270 320,295 Q300,310 275,305 Z', fill: '#81C784', label: 'tail-end' },
        // back spikes
        { d: 'M148,225 L140,190 L157,220 Z', fill: '#F44336', label: 'spike-1' },
        { d: 'M168,218 L162,180 L177,215 Z', fill: '#FF9800', label: 'spike-2' },
        { d: 'M190,214 L186,175 L200,212 Z', fill: '#FFEB3B', label: 'spike-3' },
      ],
      outlineColor: '#2E7D32',
    },
    {
      id: 'castle', name: 'Magic Castle', emoji: '🏰',
      paths: [
        // main wall
        { d: 'M70,380 L70,220 L330,220 L330,380 Z', fill: '#BDBDBD', label: 'wall' },
        // towers
        { d: 'M45,380 L45,190 L130,190 L130,380 Z', fill: '#9E9E9E', label: 'tower-l' },
        { d: 'M270,380 L270,190 L355,190 L355,380 Z', fill: '#9E9E9E', label: 'tower-r' },
        // battlements left
        { d: 'M45,190 L70,190 L70,165 L55,165 L55,148 L70,148 L70,130 L45,130 Z', fill: '#757575', label: 'batt-l' },
        { d: 'M80,190 L130,190 L130,165 L115,165 L115,148 L130,148 L130,130 L80,130 L80,148 L95,148 L95,165 L80,165 Z', fill: '#757575', label: 'batt-l2' },
        // battlements right
        { d: 'M270,190 L320,190 L320,165 L305,165 L305,148 L320,148 L320,130 L270,130 L270,148 L285,148 L285,165 L270,165 Z', fill: '#757575', label: 'batt-r' },
        { d: 'M330,190 L355,190 L355,130 L330,130 L330,148 L345,148 L345,165 L330,165 Z', fill: '#757575', label: 'batt-r2' },
        // center tower
        { d: 'M155,380 L155,170 L245,170 L245,380 Z', fill: '#E0E0E0', label: 'tower-c' },
        { d: 'M145,170 L200,110 L255,170 Z', fill: '#F44336', label: 'roof-c' },
        { d: 'M198,110 L202,80 Q203,78 200,78 Q197,78 198,80 Z', fill: '#FDD835', label: 'flag' },
        { d: 'M155,170 L178,170 L178,148 L155,148 Z', fill: '#757575', label: 'batt-c-l' },
        { d: 'M188,170 L212,170 L212,148 L188,148 Z', fill: '#757575', label: 'batt-c-m' },
        { d: 'M222,170 L245,170 L245,148 L222,148 Z', fill: '#757575', label: 'batt-c-r' },
        // gate
        { d: 'M155,380 L155,305 Q200,280 245,305 L245,380 Z', fill: '#5D4037', label: 'gate' },
        { d: 'M165,380 L165,318 Q200,300 235,318 L235,380 Z', fill: '#4E342E', label: 'gate-inner' },
        // windows
        { d: 'M170,240 Q200,225 230,240 L230,275 Q200,285 170,275 Z', fill: '#90CAF9', label: 'window-c' },
        { d: 'M60,240 L105,240 L105,270 L60,270 Z', fill: '#90CAF9', label: 'window-l' },
        { d: 'M295,240 L340,240 L340,270 L295,270 Z', fill: '#90CAF9', label: 'window-r' },
      ],
      outlineColor: '#424242',
    },
    {
      id: 'fairy', name: 'Fairy', emoji: '🧚',
      paths: [
        // wings
        { d: 'M200,200 Q145,165 110,175 Q115,205 155,210 Z', fill: '#CE93D8', label: 'wing-l-top' },
        { d: 'M200,200 Q145,215 120,240 Q140,258 168,238 Z', fill: '#F3E5F5', label: 'wing-l-bot' },
        { d: 'M200,200 Q255,165 290,175 Q285,205 245,210 Z', fill: '#CE93D8', label: 'wing-r-top' },
        { d: 'M200,200 Q255,215 280,240 Q260,258 232,238 Z', fill: '#F3E5F5', label: 'wing-r-bot' },
        // body
        { d: 'M175,230 Q200,218 225,230 L232,280 Q200,290 168,280 Z', fill: '#FFD54F', label: 'dress' },
        { d: 'M175,230 Q200,220 225,230 Q215,250 200,255 Q185,250 175,230 Z', fill: '#FFF176', label: 'dress-top' },
        // head
        { d: 'M175,210 Q200,190 225,210 Q225,235 200,240 Q175,235 175,210 Z', fill: '#FFCCBC', label: 'head' },
        { d: 'M183,218 A7,8 0 1,1 182.9,218 Z', fill: '#5C4033', label: 'eye-l' },
        { d: 'M217,218 A7,8 0 1,1 216.9,218 Z', fill: '#5C4033', label: 'eye-r' },
        { d: 'M196,227 Q200,231 204,227 Q202,234 200,234 Q198,234 196,227 Z', fill: '#FF8A80', label: 'mouth' },
        // hair
        { d: 'M175,210 Q165,185 175,165 Q190,175 190,205 Z', fill: '#FFD700', label: 'hair-l' },
        { d: 'M225,210 Q235,185 225,165 Q210,175 210,205 Z', fill: '#FFD700', label: 'hair-r' },
        { d: 'M180,170 Q200,155 220,170 Q210,160 200,157 Q190,160 180,170 Z', fill: '#FFC107', label: 'hair-top' },
        // wand
        { d: 'M232,230 L272,190', fill: 'none', stroke: '#9C27B0', sw: 4, label: 'wand', isStroke: true },
        { d: 'M272,190 A10,10 0 1,1 271.9,190 Z', fill: '#FFEB3B', label: 'wand-star' },
        // legs
        { d: 'M185,278 L180,320 L190,320 L192,278 Z', fill: '#FFCCBC', label: 'leg-l' },
        { d: 'M215,278 L212,320 L222,320 L220,278 Z', fill: '#FFCCBC', label: 'leg-r' },
        { d: 'M178,318 L172,330 L192,330 L188,318 Z', fill: '#FFD54F', label: 'shoe-l' },
        { d: 'M210,318 L208,330 L228,330 L222,318 Z', fill: '#FFD54F', label: 'shoe-r' },
      ],
      outlineColor: '#6A1B9A',
    },
  ],
};

// ── AUDIO ──────────────────────────────────────────────────
let audioCtx = null;
let soundOn = true;

function getAC() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, dur, type = 'sine', vol = 0.3) {
  if (!soundOn) return;
  try {
    const ac = getAC();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ac.currentTime + dur);
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    osc.start(); osc.stop(ac.currentTime + dur);
  } catch(e) {}
}

function playPaint() { playTone(440 + Math.random() * 300, 0.15, 'sine', 0.2); }

function playCelebrate() {
  if (!soundOn) return;
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.3, 'triangle', 0.25), i * 120);
  });
}

function playClick() { playTone(600, 0.08, 'square', 0.15); }

// ── STATE ──────────────────────────────────────────────────
let currentMode    = 'color';   // color | free
let currentCat     = 'animals';
let currentPic     = null;
let currentColor   = '#FF4444';
let currentTool    = 'brush';   // brush | fill | eraser
let brushSize      = 12;
let isDrawing      = false;
let lastX = 0, lastY = 0;

// Free draw tool
let freeColor   = '#FF4444';
let freeTool    = 'brush';
let freeBrSize  = 14;
let freeIsDrawing = false;
let freeLastX = 0, freeLastY = 0;
let freeHistory = [];

// Coloring history (for undo)
let colorHistory = [];

// ── DOM REFS ────────────────────────────────────────────────
const screenHome   = document.getElementById('screen-home');
const screenCanvas = document.getElementById('screen-canvas');
const screenFree   = document.getElementById('screen-free');

const pictureGrid  = document.getElementById('picture-grid');
const canvasTitle  = document.getElementById('canvas-title');
const freeTitle    = document.getElementById('free-title');

const bgCanvas     = document.getElementById('bg-canvas');
const colorCanvas  = document.getElementById('color-canvas');
const bgCtx        = bgCanvas.getContext('2d');
const colorCtx     = colorCanvas.getContext('2d');

const freeCanvasEl = document.getElementById('free-canvas');
const freeCtx      = freeCanvasEl.getContext('2d');

const colorSwatches  = document.getElementById('color-swatches');
const freeSwatches   = document.getElementById('free-color-swatches');
const successOverlay = document.getElementById('success-overlay');
const confettiCont   = document.getElementById('confetti-container');
const headerMode     = document.getElementById('header-mode');

function updateHeaderMode() {
  if (headerMode) headerMode.textContent = modeLabel(currentMode);
}

function updateModeUI() {
  const isFree = currentMode === 'free';
  const catRow = document.querySelector('.category-row');
  if (catRow) catRow.style.display = isFree ? 'none' : 'flex';
  if (pictureGrid) pictureGrid.style.display = isFree ? 'none' : 'grid';
}

// ── SHOW SCREEN ─────────────────────────────────────────────
function showScreen(id) {
  [screenHome, screenCanvas, screenFree].forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  requestAnimationFrame(() => {
    if (id === 'screen-canvas') resizeColorCanvas();
    if (id === 'screen-free') resizeFreeCanvas();
  });
}

// ── BUILD PALETTE ────────────────────────────────────────────
function buildPalette(container, onSelect) {
  container.innerHTML = '';
  PALETTE.forEach((c, i) => {
    const s = document.createElement('button');
    s.className = 'swatch' + (c.white ? ' white-swatch' : '');
    s.style.background = c.hex;
    s.title = c.name;
    s.dataset.hex = c.hex;
    if (i === 0) s.classList.add('active');
    s.addEventListener('click', () => {
      container.querySelectorAll('.swatch').forEach(sw => sw.classList.remove('active'));
      s.classList.add('active');
      onSelect(c.hex);
      playClick();
    });
    container.appendChild(s);
  });
}

// ── BUILD PICTURE GRID ───────────────────────────────────────
function buildGrid(cat) {
  pictureGrid.innerHTML = '';
  const pics = PICTURES[cat] || [];
  pics.forEach(pic => {
    const card = document.createElement('div');
    card.className = 'pic-card';
    card.innerHTML = `
      <div class="pic-emoji">${pic.emoji}</div>
      <div class="pic-name">${pic.name}</div>
    `;
    card.addEventListener('click', () => {
      playClick();
      openPicture(pic);
    });
    pictureGrid.appendChild(card);
  });
}

// ── OPEN PICTURE FOR COLORING ────────────────────────────────
function openPicture(pic) {
  currentPic = pic;
  canvasTitle.textContent = pic.name;
  colorHistory = [];

  if (currentMode === 'free') {
    startFreeDraw();
  } else {
    showScreen('screen-canvas');
    resizeColorCanvas();
    renderPicture(pic);
  }
}

function modeLabel(m) {
  return { free: 'Free Draw', color: 'Color' }[m] || m;
}

function startFreeDraw() {
  currentPic = null;
  freeTitle.textContent = 'Free Draw';
  showScreen('screen-free');
  resizeFreeCanvas();
  freeHistory = [];
}

// ── RENDER PICTURE ON BG CANVAS ─────────────────────────────
function renderPicture(pic) {
  const W = bgCanvas.width, H = bgCanvas.height;
  bgCtx.clearRect(0, 0, W, H);
  colorCtx.clearRect(0, 0, W, H);

  // White background
  bgCtx.fillStyle = '#FFFFFF';
  bgCtx.fillRect(0, 0, W, H);

  const scale = Math.min(W, H) * 0.82 / 400;
  const ox = (W - 400 * scale) / 2;
  const oy = (H - 400 * scale) / 2;

  // White template regions with black borders (color goes on colorCanvas)
  pic.paths.forEach(path => {
    bgCtx.save();
    bgCtx.translate(ox, oy);
    bgCtx.scale(scale, scale);
    if (path.isStroke) {
      bgCtx.strokeStyle = '#000000';
      bgCtx.lineWidth   = path.sw || 6;
      bgCtx.lineCap     = 'round';
      bgCtx.lineJoin    = 'round';
      try { bgCtx.stroke(new Path2D(path.d)); } catch(e) {}
    } else {
      bgCtx.fillStyle = '#FFFFFF';
      try { bgCtx.fill(new Path2D(path.d)); } catch(e) {}
    }
    bgCtx.restore();
  });

  drawOutlines(pic, bgCtx, scale, ox, oy);
}

function drawOutlines(pic, ctx, scale, ox, oy) {
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth   = 3.5 / scale;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.setLineDash([]);
  pic.paths.forEach(path => {
    if (path.isStroke) return;
    try { ctx.stroke(new Path2D(path.d)); } catch(e) {}
  });
  ctx.restore();
}

// ── FLOOD FILL ────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b, 255];
}

function colorsMatch(a, b, tol = 32) {
  return Math.abs(a[0]-b[0]) <= tol && Math.abs(a[1]-b[1]) <= tol && Math.abs(a[2]-b[2]) <= tol;
}

function floodFill(x, y, fillColor) {
  // Merge bg + color canvases into an offscreen canvas for sampling
  const W = bgCanvas.width, H = bgCanvas.height;
  const offscreen = document.createElement('canvas');
  offscreen.width = W; offscreen.height = H;
  const offCtx = offscreen.getContext('2d');
  offCtx.drawImage(bgCanvas, 0, 0);
  offCtx.drawImage(colorCanvas, 0, 0);

  const imageData = offCtx.getImageData(0, 0, W, H);
  const data = imageData.data;

  const px = Math.floor(x), py = Math.floor(y);
  if (px < 0 || py < 0 || px >= W || py >= H) return;

  const idx0 = (py * W + px) * 4;
  const targetColor = [data[idx0], data[idx0+1], data[idx0+2], data[idx0+3]];
  const fillRgb = hexToRgb(fillColor);

  if (colorsMatch(targetColor, fillRgb, 5)) return; // already that color

  // BFS flood fill on the merged image, write to colorCtx
  const colorData = colorCtx.getImageData(0, 0, W, H);
  const cd = colorData.data;

  const stack = [px + py * W];
  const visited = new Uint8Array(W * H);
  visited[px + py * W] = 1;

  while (stack.length) {
    const pos = stack.pop();
    const cx = pos % W, cy = Math.floor(pos / W);
    const i = pos * 4;

    // Check in merged image
    const mc = [data[i], data[i+1], data[i+2], data[i+3]];
    if (!colorsMatch(mc, targetColor, 28)) continue;

    // Paint on colorCtx data
    cd[i]   = fillRgb[0];
    cd[i+1] = fillRgb[1];
    cd[i+2] = fillRgb[2];
    cd[i+3] = 255;

    // Also update merged so neighboring checks work
    data[i]   = fillRgb[0];
    data[i+1] = fillRgb[1];
    data[i+2] = fillRgb[2];
    data[i+3] = 255;

    const neighbours = [pos-1, pos+1, pos-W, pos+W];
    for (const n of neighbours) {
      if (n >= 0 && n < W*H && !visited[n]) {
        const nx = n % W, ny = Math.floor(n / W);
        if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
          visited[n] = 1;
          stack.push(n);
        }
      }
    }
  }
  colorCtx.putImageData(colorData, 0, 0);
  // Redraw outlines on top of color layer
  if (currentPic) drawOutlines(currentPic, colorCtx, Math.min(bgCanvas.width, bgCanvas.height) * 0.82 / 400,
    (bgCanvas.width - 400 * Math.min(bgCanvas.width, bgCanvas.height) * 0.82 / 400) / 2,
    (bgCanvas.height - 400 * Math.min(bgCanvas.width, bgCanvas.height) * 0.82 / 400) / 2
  );
}

// ── CANVAS RESIZE ────────────────────────────────────────────
function resizeColorCanvas() {
  const wrap = document.getElementById('canvas-wrap');
  const W = wrap.clientWidth;
  const H = wrap.clientHeight;
  bgCanvas.width    = W; bgCanvas.height    = H;
  colorCanvas.width = W; colorCanvas.height = H;
  if (currentPic) renderPicture(currentPic);
}

function resizeFreeCanvas() {
  const wrap = document.getElementById('free-canvas-wrap');
  freeCanvasEl.width  = wrap.clientWidth;
  freeCanvasEl.height = wrap.clientHeight;
  // White bg
  freeCtx.fillStyle = '#fff';
  freeCtx.fillRect(0, 0, freeCanvasEl.width, freeCanvasEl.height);
}

// ── DRAWING ON colorCanvas ───────────────────────────────────
function getCanvasPos(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches ? e.touches[0] : e;
  return {
    x: (touch.clientX - rect.left) * (canvas.width / rect.width),
    y: (touch.clientY - rect.top)  * (canvas.height / rect.height),
  };
}

function saveColorSnap() {
  const snap = colorCtx.getImageData(0, 0, colorCanvas.width, colorCanvas.height);
  colorHistory.push(snap);
  if (colorHistory.length > 20) colorHistory.shift();
}

function onColorDown(e) {
  e.preventDefault();
  if (!currentPic) return;
  const { x, y } = getCanvasPos(e, colorCanvas);
  if (currentTool === 'fill') {
    saveColorSnap();
    floodFill(x, y, currentColor);
    playPaint();
    return;
  }
  isDrawing = true;
  lastX = x; lastY = y;
  saveColorSnap();
}

function onColorMove(e) {
  e.preventDefault();
  if (!isDrawing) return;
  const { x, y } = getCanvasPos(e, colorCanvas);
  colorCtx.beginPath();
  colorCtx.moveTo(lastX, lastY);
  colorCtx.lineTo(x, y);
  if (currentTool === 'eraser') {
    colorCtx.globalCompositeOperation = 'destination-out';
    colorCtx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    colorCtx.globalCompositeOperation = 'source-over';
    colorCtx.strokeStyle = currentColor;
  }
  colorCtx.lineWidth = brushSize;
  colorCtx.lineCap   = 'round';
  colorCtx.lineJoin  = 'round';
  colorCtx.stroke();
  colorCtx.globalCompositeOperation = 'source-over';
  lastX = x; lastY = y;
}

function onColorUp(e) {
  if (isDrawing) playPaint();
  isDrawing = false;
  // Redraw outlines on color layer
  if (currentPic) {
    const scale = Math.min(bgCanvas.width, bgCanvas.height) * 0.82 / 400;
    const ox = (bgCanvas.width  - 400 * scale) / 2;
    const oy = (bgCanvas.height - 400 * scale) / 2;
    drawOutlines(currentPic, colorCtx, scale, ox, oy);
  }
}

// ── FREE DRAW ENGINE ─────────────────────────────────────────
function saveFreeSnap() {
  const snap = freeCtx.getImageData(0, 0, freeCanvasEl.width, freeCanvasEl.height);
  freeHistory.push(snap);
  if (freeHistory.length > 25) freeHistory.shift();
}

function onFreeDown(e) {
  e.preventDefault();
  const { x, y } = getCanvasPos(e, freeCanvasEl);
  freeIsDrawing = true;
  freeLastX = x; freeLastY = y;
  saveFreeSnap();
}

function onFreeMove(e) {
  e.preventDefault();
  if (!freeIsDrawing) return;
  const { x, y } = getCanvasPos(e, freeCanvasEl);

  freeCtx.beginPath();
  freeCtx.moveTo(freeLastX, freeLastY);
  freeCtx.lineTo(x, y);
  if (freeTool === 'eraser') {
    freeCtx.globalCompositeOperation = 'destination-out';
    freeCtx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    freeCtx.globalCompositeOperation = 'source-over';
    freeCtx.strokeStyle = freeColor;
  }
  freeCtx.lineWidth = freeBrSize;
  freeCtx.lineCap  = 'round';
  freeCtx.lineJoin = 'round';
  freeCtx.stroke();
  freeCtx.globalCompositeOperation = 'source-over';

  freeLastX = x; freeLastY = y;
  playPaint();
}

function onFreeUp() {
  freeIsDrawing = false;
}

// ── CONFETTI ─────────────────────────────────────────────────
const CONFETTI_COLORS = ['#FF4444','#FFD700','#FF69B4','#4CAF50','#00BCD4','#9C27B0','#FF9800','#2196F3'];

function launchConfetti() {
  confettiCont.innerHTML = '';
  for (let i = 0; i < 55; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left        = (Math.random() * 100) + '%';
    piece.style.background  = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    piece.style.width       = (Math.random() * 10 + 6) + 'px';
    piece.style.height      = (Math.random() * 10 + 6) + 'px';
    piece.style.borderRadius= Math.random() > 0.5 ? '50%' : '2px';
    piece.style.animationDuration  = (Math.random() * 2 + 1.5) + 's';
    piece.style.animationDelay     = (Math.random() * 0.6) + 's';
    confettiCont.appendChild(piece);
  }
  setTimeout(() => { confettiCont.innerHTML = ''; }, 3500);
}

// ── SUCCESS SCREEN ────────────────────────────────────────────
const EMOJIS  = ['🌟','🎉','🏆','🎨','🦋','🌈','🎊','🥳','💖','🌸'];
const MSGS    = [
  'You colored it beautifully!',
  'What a masterpiece! 🖼️',
  'Wow, amazing colors!',
  'You\'re a true artist! 🎨',
  'Fantastic job! Keep it up!',
  'So pretty! Great work!',
];

function showSuccess() {
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  const msg   = MSGS[Math.floor(Math.random() * MSGS.length)];
  document.getElementById('success-emoji').textContent = emoji;
  document.getElementById('success-msg').textContent   = msg;
  successOverlay.classList.remove('hidden');
  launchConfetti();
  playCelebrate();
}

// ── UNDO ──────────────────────────────────────────────────────
document.getElementById('btn-undo').addEventListener('click', () => {
  if (colorHistory.length) {
    colorCtx.putImageData(colorHistory.pop(), 0, 0);
    playClick();
  }
});

document.getElementById('btn-free-undo').addEventListener('click', () => {
  if (freeHistory.length) {
    freeCtx.putImageData(freeHistory.pop(), 0, 0);
    playClick();
  }
});

document.getElementById('btn-clear').addEventListener('click', () => {
  saveColorSnap();
  colorCtx.clearRect(0, 0, colorCanvas.width, colorCanvas.height);
  playClick();
});

document.getElementById('btn-free-clear').addEventListener('click', () => {
  saveFreeSnap();
  freeCtx.fillStyle = '#fff';
  freeCtx.fillRect(0, 0, freeCanvasEl.width, freeCanvasEl.height);
  playClick();
});

// ── DONE BUTTONS ──────────────────────────────────────────────
document.getElementById('btn-done').addEventListener('click', showSuccess);
document.getElementById('btn-free-done').addEventListener('click', showSuccess);

// ── SUCCESS OVERLAY BUTTONS ───────────────────────────────────
document.getElementById('btn-next-pic').addEventListener('click', () => {
  successOverlay.classList.add('hidden');
  if (!currentPic || currentMode === 'free') {
    startFreeDraw();
  } else {
    const pics = PICTURES[currentCat] || [];
    const idx  = pics.findIndex(p => p.id === currentPic.id);
    const next = pics[(idx + 1) % pics.length];
    openPicture(next);
  }
  playClick();
});

document.getElementById('btn-color-again').addEventListener('click', () => {
  successOverlay.classList.add('hidden');
  if (currentMode === 'free') {
    startFreeDraw();
  } else if (currentPic) {
    openPicture(currentPic);
  }
  playClick();
});

// ── BACK BUTTONS ──────────────────────────────────────────────
document.getElementById('btn-back-home').addEventListener('click', () => {
  successOverlay.classList.add('hidden');
  showScreen('screen-home');
  playClick();
});

document.getElementById('btn-free-back').addEventListener('click', () => {
  successOverlay.classList.add('hidden');
  showScreen('screen-home');
  playClick();
});

// ── SOUND BUTTONS ─────────────────────────────────────────────
function toggleSound(btn) {
  soundOn = !soundOn;
  btn.textContent = soundOn ? '🔊' : '🔇';
}
document.getElementById('btn-sound-home').addEventListener('click', (e) => toggleSound(e.currentTarget));
document.getElementById('btn-sound-canvas').addEventListener('click', (e) => toggleSound(e.currentTarget));

// ── MODE PILLS ────────────────────────────────────────────────
document.querySelectorAll('.mode-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;
    playClick();
    updateHeaderMode();
    updateModeUI();
    if (currentMode === 'free') {
      startFreeDraw();
    } else {
      successOverlay.classList.add('hidden');
      showScreen('screen-home');
      buildGrid(currentCat);
    }
  });
});

// ── CATEGORY CHIPS ────────────────────────────────────────────
document.querySelectorAll('.cat-chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.cat-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCat = btn.dataset.cat;
    buildGrid(currentCat);
    playClick();
  });
});

// ── TOOL BUTTONS ──────────────────────────────────────────────
document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTool = btn.dataset.tool;
    colorCanvas.style.cursor = currentTool === 'fill' ? 'cell' : 'crosshair';
    playClick();
  });
});

document.querySelectorAll('.tool-btn[data-ftool]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn[data-ftool]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    freeTool = btn.dataset.ftool;
    playClick();
  });
});

// ── BRUSH SIZE ────────────────────────────────────────────────
document.getElementById('brush-size').addEventListener('input', (e) => {
  brushSize = parseInt(e.target.value);
});
document.getElementById('free-brush-size').addEventListener('input', (e) => {
  freeBrSize = parseInt(e.target.value);
});

// ── COLOR CANVAS EVENTS ───────────────────────────────────────
colorCanvas.addEventListener('mousedown',  onColorDown);
colorCanvas.addEventListener('mousemove',  onColorMove);
colorCanvas.addEventListener('mouseup',    onColorUp);
colorCanvas.addEventListener('mouseleave', onColorUp);
colorCanvas.addEventListener('touchstart', onColorDown, { passive: false });
colorCanvas.addEventListener('touchmove',  onColorMove, { passive: false });
colorCanvas.addEventListener('touchend',   onColorUp);

// ── FREE CANVAS EVENTS ────────────────────────────────────────
freeCanvasEl.addEventListener('mousedown',  onFreeDown);
freeCanvasEl.addEventListener('mousemove',  onFreeMove);
freeCanvasEl.addEventListener('mouseup',    onFreeUp);
freeCanvasEl.addEventListener('mouseleave', onFreeUp);
freeCanvasEl.addEventListener('touchstart', onFreeDown, { passive: false });
freeCanvasEl.addEventListener('touchmove',  onFreeMove, { passive: false });
freeCanvasEl.addEventListener('touchend',   onFreeUp);

// ── RESIZE ────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  if (screenCanvas.classList.contains('active')) resizeColorCanvas();
  if (screenFree.classList.contains('active'))   resizeFreeCanvas();
});

// ── INIT ──────────────────────────────────────────────────────
buildPalette(colorSwatches, hex => { currentColor = hex; });
buildPalette(freeSwatches,  hex => { freeColor    = hex; });
buildGrid('animals');
updateHeaderMode();
updateModeUI();
