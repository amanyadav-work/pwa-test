import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, X } from 'lucide-react';

export const DropzoneField = ({
  multiple = false,
  accept,
  className,
  onDrop: externalOnDrop,
  value,
  text = 'Drag & drop files here, or click to browse',
  icon= <UploadCloud className="w-8 h-8 text-gray-500 mb-2" />,
  onRemoveFile,
  showFileList = true,
  defaultFiles = [],
  hideZoneWhenSelected = false
}) => {
  const [internalFiles, setInternalFiles] = useState(defaultFiles);
  const files = value || internalFiles;

  const handleDrop = useCallback(
    (acceptedFiles) => {
      if (!value) {
        setInternalFiles(acceptedFiles);
      }
      if (externalOnDrop) {
        externalOnDrop(acceptedFiles);
      }
    },
    [externalOnDrop, value]
  );

  const handleRemove = (index) => {
    const updatedFiles = [...files];
    const removedFile = updatedFiles.splice(index, 1)[0];

    if (!value) {
      setInternalFiles(updatedFiles);
    }

    if (onRemoveFile) {
      onRemoveFile(removedFile, updatedFiles);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    multiple,
    accept,
  });

  return (
    <div className="space-y-3">
      {/* Drop area */}
      {!(hideZoneWhenSelected && files.length > 0) && <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          } ${className}`}
      >
        <input {...getInputProps()} />
        {icon}
        <p className="text-sm text-gray-500 text-center">
          {isDragActive
            ? 'Drop the file(s) here...'
            :text}
        </p>
      </div>}

      {/* File list */}
      {showFileList && files.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700 dark:text-blue-soft">
            Selected file{files.length > 1 ? 's' : ''}:
          </span>
          <ul className="text-sm dark:text-blue-soft text-blue-marine space-y-1">
            {files.map((file, idx) => (
              <li key={idx} className="flex p-1 border dark:border-blue-soft rounded-xs w-fit px-2 items-center gap-2 ">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4  opacity-50" />
                  {file.name}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="hover:text-red-support "
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};