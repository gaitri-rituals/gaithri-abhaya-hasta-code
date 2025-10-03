import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onClose, onScan }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('unknown'); // 'granted', 'denied', 'unknown'
  const scannerRef = useRef(null);
  const html5QrCodeScannerRef = useRef(null);

  useEffect(() => {
    checkCameraPermission();
    return () => {
      stopScanner();
    };
  }, []);

  const checkCameraPermission = async () => {
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'camera' });
        setPermissionStatus(permission.state);
        
        permission.addEventListener('change', () => {
          setPermissionStatus(permission.state);
        });
      }
    } catch (error) {
      console.log('Permission API not supported');
      setPermissionStatus('unknown');
    }
  };

  const startScanner = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Request camera permission
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        supportedScanTypes: [Html5QrcodeScanner.SCAN_TYPE_CAMERA]
      };

      html5QrCodeScannerRef.current = new Html5QrcodeScanner(
        "qr-scanner-container",
        config,
        false
      );

      html5QrCodeScannerRef.current.render(
        (decodedText, decodedResult) => {
          console.log('QR Code scanned:', decodedText);
          setScannedData(decodedText);
          stopScanner();
          
          // Handle the scanned data
          if (onScan) {
            onScan(decodedText, decodedResult);
          } else {
            // Default handling - could be navigation, showing data, etc.
            handleDefaultScan(decodedText);
          }
        },
        (errorMessage) => {
          // Handle scan failure - usually not a problem
          console.log('QR scan error (ignorable):', errorMessage);
        }
      );

    } catch (error) {
      console.error('Camera access error:', error);
      setError('Camera access denied. Please enable camera permissions and try again.');
      setIsScanning(false);
      setPermissionStatus('denied');
    }
  };

  const stopScanner = () => {
    if (html5QrCodeScannerRef.current) {
      html5QrCodeScannerRef.current.clear();
      html5QrCodeScannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleDefaultScan = (data) => {
    // Handle different types of QR codes
    try {
      // Check if it's a URL
      if (data.startsWith('http://') || data.startsWith('https://')) {
        if (confirm(`Open this link?\n${data}`)) {
          window.open(data, '_blank');
        }
      }
      // Check if it's a temple service code
      else if (data.startsWith('TEMPLE_')) {
        alert(`Temple service code detected: ${data}`);
        // Handle temple-specific QR codes
      }
      // Check if it's JSON data
      else if (data.startsWith('{') && data.endsWith('}')) {
        const parsed = JSON.parse(data);
        alert(`Data received: ${JSON.stringify(parsed, null, 2)}`);
      }
      // Default text handling
      else {
        alert(`QR Code Content: ${data}`);
      }
    } catch (error) {
      alert(`QR Code Content: ${data}`);
    }

    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Handle QR code from image file
      // This would require additional library or service
      alert('QR code scanning from image files coming soon!');
    }
  };

  const requestPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setPermissionStatus('granted');
      startScanner();
    } catch (error) {
      setPermissionStatus('denied');
      setError('Camera permission is required to scan QR codes.');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex flex-col"
      >
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm"
        >
          <h2 className="text-xl font-semibold text-white">QR Scanner</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
        </motion.div>

        {/* Scanner Area */}
        <div className="flex-1 relative flex items-center justify-center">
          {!isScanning && !scannedData && permissionStatus !== 'granted' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center text-white p-8"
            >
              {permissionStatus === 'denied' ? (
                <div className="space-y-6">
                  <div className="w-20 h-20 mx-auto bg-destructive/20 rounded-full flex items-center justify-center">
                    <AlertCircle size={40} className="text-destructive" />
                  </div>
                  <h3 className="text-2xl font-bold">Camera Access Required</h3>
                  <p className="text-white/80">
                    Please enable camera permissions in your browser settings to scan QR codes.
                  </p>
                  <button
                    onClick={requestPermission}
                    className="btn-divine"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                    <Camera size={40} className="text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">Ready to Scan</h3>
                  <p className="text-white/80">
                    Point your camera at a QR code to scan it automatically.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={startScanner}
                      className="btn-divine flex items-center gap-2"
                    >
                      <Camera size={20} />
                      Start Scanning
                    </button>
                    
                    <label className="btn-temple flex items-center gap-2 cursor-pointer">
                      <Upload size={20} />
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Scanner Container */}
          {isScanning && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md mx-auto p-4"
            >
              <div id="qr-scanner-container" className="w-full"></div>
              
              {/* Scanning Instructions */}
              <div className="mt-6 text-center text-white">
                <p className="text-lg font-medium mb-2">Scanning...</p>
                <p className="text-white/80">
                  Hold your device steady and point at the QR code
                </p>
              </div>

              {/* Cancel Button */}
              <div className="mt-6 text-center">
                <button
                  onClick={onClose}
                  className="btn-temple text-white"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {/* Success State */}
          {scannedData && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center text-white p-8 max-w-md mx-4"
            >
              <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={40} className="text-green-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">QR Code Scanned!</h3>
              <div className="bg-white/10 rounded-lg p-4 mb-6">
                <p className="text-sm text-white/80 mb-2">Scanned Data:</p>
                <p className="text-white font-mono text-sm break-all">
                  {scannedData}
                </p>
              </div>
              <button
                onClick={onClose}
                className="btn-divine"
              >
                Done
              </button>
            </motion.div>
          )}

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center text-white p-8 max-w-md mx-4"
            >
              <div className="w-20 h-20 mx-auto bg-destructive/20 rounded-full flex items-center justify-center mb-6">
                <AlertCircle size={40} className="text-destructive" />
              </div>
              <h3 className="text-xl font-bold mb-4">Scanner Error</h3>
              <p className="text-white/80 mb-6">{error}</p>
              <div className="flex gap-4 justify-center">
                <button onClick={requestPermission} className="btn-divine">
                  Try Again
                </button>
                <button onClick={onClose} className="btn-temple text-white">
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer Instructions */}
        {isScanning && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-4 bg-black/50 backdrop-blur-sm text-center text-white/80 text-sm"
          >
            <p>Make sure the QR code is well-lit and clearly visible within the frame</p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default QRScanner;