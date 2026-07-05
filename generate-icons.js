#!/usr/bin/env node
/**
 * generate-icons.js
 * Generates placeholder SVG icons for CookingINA PWA.
 * Run: node generate-icons.js
 * For production, replace with proper 192x192 and 512x512 PNG icons.
 */
const fs = require('fs')
const path = require('path')

const SVG = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="#C4622D"/>
  <text x="50%" y="54%" font-size="${size * 0.55}" text-anchor="middle" dominant-baseline="middle" font-family="serif">🍳</text>
</svg>`

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#C4622D"/>
  <text x="50%" y="54%" font-size="18" text-anchor="middle" dominant-baseline="middle" font-family="serif">🍳</text>
</svg>`

const iconsDir = path.join(__dirname, 'public', 'icons')
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true })

fs.writeFileSync(path.join(iconsDir, 'icon-192.svg'), SVG(192))
fs.writeFileSync(path.join(iconsDir, 'icon-512.svg'), SVG(512))
fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), FAVICON_SVG)

console.log('✅ SVG icons generated in public/icons/')
console.log('⚠️  For production, convert SVGs to PNG using a tool like Sharp or Squoosh.')
