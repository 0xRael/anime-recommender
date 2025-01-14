/** @type {import('next').NextConfig} */
const nextConfig = {
reactStrictMode: true,
images: {
domains: ['s4.anilist.co'],
},
plugins: [require('tailwindcss')],
}

module.exports = nextConfig