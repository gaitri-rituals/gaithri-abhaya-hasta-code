import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const EditAddressModal = ({ address, onClose, onSave }) => {
  const [shortName, setShortName] = useState(address?.shortName || '');
  const [fullName, setFullName] = useState(address?.fullName || '');

  const handleSave = () => {
    if (shortName.trim() && fullName.trim()) {
      onSave({
        ...address,
        shortName: shortName.trim(),
        fullName: fullName.trim()
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="card-divine w-full max-w-md p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-divine rounded-full flex items-center justify-center">
              <MapPin size={20} className="text-white" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Edit Address</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Address Name
            </label>
            <Input
              type="text"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              placeholder="e.g., Home, Office, Temple"
              className="input-divine"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Full Address
            </label>
            <Input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Complete address"
              className="input-divine"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-gradient-divine text-white hover:shadow-sacred"
            disabled={!shortName.trim() || !fullName.trim()}
          >
            <Save size={16} className="mr-2" />
            Save Changes
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default EditAddressModal;