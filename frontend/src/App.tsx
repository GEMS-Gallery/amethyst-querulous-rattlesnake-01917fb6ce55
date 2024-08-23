import React, { useEffect, useRef, useState } from 'react';
import { Button, Container, Typography, Box, CircularProgress } from '@mui/material';
import { backend } from 'declarations/backend';

declare global {
  interface Window {
    faceapi: any;
  }
}

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);

  const waitForFaceApi = () => {
    return new Promise<any>((resolve, reject) => {
      const checkFaceApi = () => {
        if (window.faceapi) {
          resolve(window.faceapi);
        } else {
          setTimeout(checkFaceApi, 100);
        }
      };
      checkFaceApi();
      setTimeout(() => reject(new Error('Timeout waiting for faceapi')), 10000);
    });
  };

  const loadModels = async () => {
    try {
      const faceapi = await waitForFaceApi();
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      setModelsLoaded(true);
    } catch (error) {
      console.error("Error loading models:", error);
      setStatus("Error loading face detection models");
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    if (modelsLoaded) {
      startVideo();
    }
  }, [modelsLoaded]);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error("Error accessing the camera:", err);
        setStatus("Error accessing the camera");
      });
  };

  const captureAndDetect = async () => {
    if (!videoRef.current || !canvasRef.current || !window.faceapi) return;

    setLoading(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const displaySize = { width: video.width, height: video.height };
    window.faceapi.matchDimensions(canvas, displaySize);

    try {
      const detections = await window.faceapi.detectAllFaces(video, new window.faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        setStatus("No face detected");
        setLoading(false);
        return;
      }

      const faceDescriptor = Array.from(detections[0].descriptor);
      const matchResult = await backend.compareFaceDescriptor(faceDescriptor);
      if (matchResult === null) {
        const newIndex = await backend.addFaceDescriptor(faceDescriptor);
        setStatus(`New face detected! This is face #${newIndex + 1}`);
      } else {
        setStatus(`Face recognized! This is face #${matchResult + 1}`);
      }

      const resizedDetections = window.faceapi.resizeResults(detections, displaySize);
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      window.faceapi.draw.drawDetections(canvas, resizedDetections);
    } catch (error) {
      console.error("Error processing face:", error);
      setStatus("Error processing face");
    } finally {
      setLoading(false);
    }
  };

  if (!modelsLoaded) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
          <Typography variant="h6" component="div" sx={{ ml: 2 }}>
            Loading face detection models...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          AI Face Detection App
        </Typography>
        <Box sx={{ position: 'relative', width: '100%', maxWidth: 640, height: 480, mb: 2 }}>
          <video ref={videoRef} width="100%" height="100%" autoPlay muted />
          <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={captureAndDetect}
          disabled={loading}
          sx={{ mb: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Capture and Detect Face'}
        </Button>
        <Typography variant="body1">{status}</Typography>
      </Box>
    </Container>
  );
};

export default App;
