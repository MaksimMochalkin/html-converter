import React, { useState } from 'react';
import axios from 'axios';

const FileUploaderComponent = () => {
  let htmlFileResponse;
  let fileForConvert;
  const [htmlFiles, setHtmlFiles] = useState([]);

  const handleFileChange = (event) => {
    const newFiles = [...event.target.files];

    setHtmlFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  const handleRemoveItem = (index) => {
    const newFiles = [...htmlFiles];
    newFiles.splice(index, 1);

    setHtmlFiles(newFiles);
  };

  const pollForPdfLink = async (retryCount) => {
    try {
      const pdfResponse = await axios.get(
        'https://localhost:7266/api/Pdf/getPdfLink?htmlBlobName=' + htmlFileResponse.data.htmlBlobName
      );
      handleLinks(pdfResponse, retryCount);
    } catch (error) {
      console.error('Error polling for PDF link:', error);
      if (error.response) {
        if (retryCount < 10) {
          setTimeout(() => pollForPdfLink(retryCount + 1), 500);
        } else {
          console.error('Error converting HTML to PDF: Maximum retries reached');
        }
      }
    }
  };

  const handleLinks = (response, retryCount) => {
    if (response.status === 200 && response.data.pdfDownloadLink) {
      setHtmlFiles((prevFiles) =>
        prevFiles.map((prevFile, index) =>
          index === htmlFiles.indexOf(fileForConvert)
            ? { ...prevFile, pdfDownloadLink: response.data.pdfDownloadLink }
            : prevFile
        )
      );
    } else if (retryCount < 10) {
      setTimeout(() => pollForPdfLink(retryCount + 1), 500);
    } else {
      console.error('Error converting HTML to PDF: Timeout');
    }
  };

  const showAlert = (message) => {
    window.alert(message);
  };

  const handleConvertClick = async (file) => {
    try {
      fileForConvert = file;
      const formData = new FormData();
      formData.append('htmlFile', file);

      htmlFileResponse = await axios.post('https://localhost:7266/api/Html/putHtmlTo', formData);

      pollForPdfLink(0);
    } catch (error) {
      showAlert('Error converting HTML to PDF. Please try again');
    }
  };

  return (
    <div>
      <h1>HTML to PDF Converter</h1>
      <input type="file" accept=".html" multiple onChange={handleFileChange} />

      <ul>
        {htmlFiles.map((file, index) => (
          <li key={index}>
            <strong>{file.name}</strong>
            {file.pdfDownloadLink ? (
              <>
                <a href={file.pdfDownloadLink} target="_blank" rel="noopener noreferrer">
                  Download PDF
                </a>
                <button onClick={() => handleRemoveItem(index)}>Remove</button>
              </>
            ) : (
              <button onClick={() => handleConvertClick(file)}>Convert to PDF</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FileUploaderComponent;