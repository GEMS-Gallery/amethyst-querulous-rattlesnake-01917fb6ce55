import React, { useEffect, useRef, useState } from 'react';
import { Button, Container, Typography, Box, CircularProgress } from '@mui/material';
import { backend } from 'declarations/backend';

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadModels();
    startVideo();
  }, []);

  const loadModels = async () => {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    ]);
  };

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => console.error("Error accessing the camera:", err));
  };

  const captureAndDetect = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setLoading(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length === 0) {
      setStatus("No face detected");
      setLoading(false);
      return;
    }

    const faceDescriptor = Array.from(detections[0].descriptor);
    try {
      const matchResult = await backend.compareFaceDescriptor(faceDescriptor);
      if (matchResult === null) {
        const newIndex = await backend.addFaceDescriptor(faceDescriptor);
        setStatus(`New face detected! This is face #${newIndex + 1}`);
      } else {
        setStatus(`Face recognized! This is face #${matchResult + 1}`);
      }
    } catch (error) {
      console.error("Error interacting with backend:", error);
      setStatus("Error processing face");
    }

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);

    setLoading(false);
  };

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
