
'use client';

import React, { useEffect, useRef } from 'react';


interface AudioVisualizerProps {
    audioUrl?: string;
    isPlaying: boolean;
}

const HEART_BARS = 40;
const HEART_WIDTH = 400;
const HEART_HEIGHT = 200;

function getHeartBarHeights(): number[] {
    
    const heights: number[] = [];
    for (let i = 0; i < HEART_BARS; i++) {
        const x = (i / (HEART_BARS - 1)) * 2 - 1;
        const y = Math.pow(Math.abs(x), 2 / 3) + Math.sqrt(1 - x * x);
        heights.push(y);
    }
    
    const max = Math.max(...heights);
    return heights.map(h => h / max);
}

const heartBarHeights = getHeartBarHeights();


const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioUrl, isPlaying }) => {
    

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationIdRef = useRef<number | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);

    
    useEffect(() => {
        if (!audioUrl) {
            
            drawVisualizer();
            return;
        }
        if (audioCtxRef.current && analyserRef.current && audioRef.current) return;

        
        const audio = new window.Audio(audioUrl);
        audio.crossOrigin = 'anonymous';
        audioRef.current = audio;

        
        const audioCtx = typeof window.AudioContext !== 'undefined'
            ? new window.AudioContext()
            : typeof (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext !== 'undefined'
                ? new (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext()
                : null;
        if (!audioCtx) return;
        audioCtxRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;

        
        const source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        
        function animate() {
            drawVisualizer();
            animationIdRef.current = requestAnimationFrame(animate);
        }
        animate();

        return () => {
            if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
            audio.pause();
            audio.src = '';
            source.disconnect();
            analyser.disconnect();
            audioCtx.close();
        };
    }, [audioUrl]);

    useEffect(() => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.play();
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying]);

    function drawVisualizer() {
        const canvas = canvasRef.current;
        const analyser = analyserRef.current;
        if (!canvas || !analyser) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const freqData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freqData);

        
        const barCount = HEART_BARS;
        const barWidth = HEART_WIDTH / (barCount + 2);
        const baseY = HEART_HEIGHT * 0.7;
        for (let i = 0; i < barCount; i++) {
            
            const heartScale = heartBarHeights[i];
            
            const freqIndex = Math.floor((i / barCount) * freqData.length);
            const peak = freqData[freqIndex] / 255;
            const barHeight = heartScale * peak * HEART_HEIGHT * 0.5;
            const x = i * barWidth + barWidth;
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(200,255,255,0.9)';
            ctx.lineWidth = barWidth * 0.7;
            ctx.moveTo(x, baseY);
            ctx.lineTo(x, baseY - barHeight);
            ctx.stroke();
            ctx.restore();
        }
    }

    return (
        <canvas
            ref={canvasRef}
            width={HEART_WIDTH}
            height={HEART_HEIGHT}
            style={{ background: 'transparent', display: 'block', margin: '0 auto' }}
            className="rounded-md"
        />
    );
};
export default AudioVisualizer;
