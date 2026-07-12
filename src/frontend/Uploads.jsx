import { useEffect, useState } from 'react'
import Sidebar from '../Components/Sidebar/Sidebar'
import styles from './Uploads.module.css'

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api`

function Uploads() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [processingResult, setProcessingResult] = useState(null)
  const [processingError, setProcessingError] = useState(null)
  const [error, setError] = useState(null)

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return
    setFile(selectedFile)
    setError(null)
    handleUpload(selectedFile)
  }

  const handleUpload = async (fileToUpload) => {
    if (!fileToUpload) return

    try {
      setUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', fileToUpload)

      const res = await fetch(`${API_BASE_URL}/datasets/upload`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setUploadResult(data)
      setFile(fileToUpload)
      setProcessingResult(null)
      setProcessingError(null)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleBrowseClick = () => {
    const input = document.getElementById('file-input')
    input?.click()
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleDeleteFile = () => {
    setFile(null)
    setUploadResult(null)
    setProcessingResult(null)
    setProcessingError(null)
    setError(null)
  }

  const handleProcessData = async () => {
    if (!uploadResult?.datasetId) return

    try {
      setProcessing(true)
      setProcessingError(null)

      const res = await fetch(`${API_BASE_URL}/pipeline/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datasetId: uploadResult.datasetId,
          forecastDays: 7,
          forecastModel: 'xgboost',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Data processing failed')
      }

      setProcessingResult({
        jobId: data.job_id || data.jobId || 'N/A',
        status: data.status || 'COMPLETED',
      })
    } catch (err) {
      console.error('Processing error:', err)
      setProcessingError(err.message)
      setProcessingResult(null)
    } finally {
      setProcessing(false)
    }
  }

  useEffect(() => {
    const links = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
      'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
    ].map((href) => {
      const existing = document.querySelector(`link[href="${href}"]`)
      if (existing) return null

      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      document.head.appendChild(link)
      return link
    })

    return () => {
      links.forEach((link) => {
        if (link?.parentNode) {
          link.parentNode.removeChild(link)
        }
      })
    }
  }, [])

  return (
    <div className={styles.page}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              aria-label="Open sidebar"
              className={styles.menuToggle}
              onClick={() => setSidebarOpen(true)}
              type="button"
            >
              <span className={`${styles.icon} material-symbols-outlined`}>menu</span>
            </button>

            <p className={styles.brand}>DemandPilot</p>

            <nav className={styles.topnavLinks}>
              <button type="button">Dashboard</button>
              <button type="button">Inventory</button>
              <button className={styles.topnavActive} type="button">Uploads</button>
              <button type="button">Analytics</button>
            </nav>
          </div>

          <div className={styles.topbarRight}>
            <button aria-label="Notifications" className={styles.iconButton} type="button">
              <span className={`${styles.icon} material-symbols-outlined`}>notifications</span>
            </button>
            <button aria-label="Help" className={styles.iconButton} type="button">
              <span className={`${styles.icon} material-symbols-outlined`}>help_outline</span>
            </button>
            <img
              alt="User profile"
              className={styles.avatar}
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOPRnhs7JNgWdtowx2cEagjMieu2YJrFxltuLK5-edBIyri_MnThMCHZKhVn2n5uI5axFsEgM47xIdQn9g-nLIjQ6VTy4bN4RwEIxcJUtLqhwXNBOaS8w2y2M57en8bF5hx4ZzrtFl9nXSwmY2DLtvZU1-UsrySStDv6XntubiTTnNBfztzRtYLO28ef9WPiznOsrPkZu5I7k4Y4r8tOhmRFEOnFcH-YxM0h-UM9mXYD8tCpwfZ_rOqUzx3iQgrH2yzXt1uDNcG_c"
            />
          </div>
        </header>

        <section className={styles.content}>
          <div className={styles.headBlock}>
            <span className={styles.kicker}>Inventory Management</span>
            <h1>Upload Inventory Data</h1>
            <p>Upload your Excel or CSV file to generate demand forecasts and inventory insights using our precision intelligence engine.</p>
          </div>

          <div className={styles.grid}>
            <div className={styles.mainCol}>
              <article className={styles.card}>
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                {!uploadResult ? (
                  <div className={styles.uploadDrop}>
                    <div className={styles.uploadIconWrap}>
                      <span className={`${styles.icon} material-symbols-outlined`}>cloud_upload</span>
                    </div>
                    <h3>Drag and drop your file here or browse files</h3>
                    <p>Supports .csv, .xls, .xlsx (Max 50MB)</p>
                    <button
                      className={styles.primaryBtn}
                      type="button"
                      onClick={handleBrowseClick}
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : 'Browse Files'}
                    </button>
                  </div>
                ) : (
                  <div className={styles.uploadSuccess}>
                    <div className={styles.uploadSuccessLeft}>
                      <div className={styles.checkWrap}>
                        <span className={`${styles.icon} material-symbols-outlined`}>check_circle</span>
                      </div>
                      <div>
                        <strong>{file?.name}</strong>
                        <small>
                          File uploaded successfully • {uploadResult.rowsProcessed} rows processed
                        </small>
                      </div>
                    </div>
                    <button
                      aria-label="Delete file"
                      className={styles.deleteButton}
                      type="button"
                      onClick={handleDeleteFile}
                    >
                      <span className={`${styles.icon} material-symbols-outlined`}>delete</span>
                    </button>
                  </div>
                )}

                {error && (
                  <div className={styles.errorMessage}>
                    <span className={`${styles.icon} material-symbols-outlined`}>error</span>
                    <p>{error}</p>
                  </div>
                )}
              </article>

              {uploadResult && (
                <article className={styles.card}>
                  <div className={styles.cardHeadRow}>
                    <h3>Upload Summary</h3>
                    <span className={styles.goodBadge}>
                      <i />
                      {uploadResult.rowsRejected === 0 ? 'Data looks good' : `${uploadResult.rowsRejected} rows rejected`}
                    </span>
                  </div>

                  <div className={styles.summaryStats}>
                    <div className={styles.statRow}>
                      <span>Total Rows Processed:</span>
                      <strong>{uploadResult.rowsProcessed}</strong>
                    </div>
                    <div className={styles.statRow}>
                      <span>Rows Rejected:</span>
                      <strong className={uploadResult.rowsRejected > 0 ? styles.error : ''}>
                        {uploadResult.rowsRejected}
                      </strong>
                    </div>
                    <div className={styles.statRow}>
                      <span>Status:</span>
                      <strong>{uploadResult.status}</strong>
                    </div>
                    <div className={styles.statRow}>
                      <span>Dataset ID:</span>
                      <strong>{uploadResult.datasetId}</strong>
                    </div>
                  </div>
                </article>
              )}
            </div>

            <aside className={styles.sideCol}>
              <article className={`${styles.card} ${styles.stickyCard}`}>
                <h3 className={styles.validationTitle}>
                  <span className={`${styles.icon} material-symbols-outlined`}>verified</span>
                  Status
                </h3>

                <div className={styles.validationList}>
                  <div className={styles.validationRow}>
                    <div className={styles.validationLeft}>
                      <span className={`${styles.icon} material-symbols-outlined ${styles.detectedIcon}`}>
                        {(uploading || uploadResult) ? 'check_circle' : 'upload'}
                      </span>
                      <span>File Upload</span>
                    </div>
                    <span className={styles.detectedBadge}>
                      {uploading ? 'Uploading...' : uploadResult ? 'Complete' : 'Ready'}
                    </span>
                  </div>

                  <div className={styles.validationRow}>
                    <div className={styles.validationLeft}>
                      <span className={`${styles.icon} material-symbols-outlined ${styles.detectedIcon}`}>
                        {uploadResult?.rowsRejected === 0 ? 'check_circle' : 'pending'}
                      </span>
                      <span>Data Validation</span>
                    </div>
                    <span className={styles.detectedBadge}>
                      {uploadResult ? (uploadResult.rowsRejected === 0 ? 'Valid' : 'Issues') : 'Pending'}
                    </span>
                  </div>

                  <div className={styles.validationRow}>
                    <div className={styles.validationLeft}>
                      <span className={`${styles.icon} material-symbols-outlined ${styles.detectedIcon}`}>
                        {uploadResult?.status === 'INGESTED' ? 'check_circle' : 'pending'}
                      </span>
                      <span>Data Ingestion</span>
                    </div>
                    <span className={styles.detectedBadge}>
                      {uploadResult?.status || 'Pending'}
                    </span>
                  </div>
                </div>

                <div className={styles.infoBox}>
                  <span className={`${styles.icon} material-symbols-outlined`}>info</span>
                  <p>
                    {uploadResult
                      ? 'Your data has been ingested and is ready for analysis. Dashboard will update within 30 seconds.'
                      : 'Select and upload a CSV file to get started.'}
                  </p>
                </div>
              </article>
            </aside>
          </div>

          <div className={styles.footerActions}>
            <button className={styles.cancelBtn} type="button" onClick={handleDeleteFile}>Clear</button>
            {uploadResult && (
              <button className={styles.primaryBtn} type="button" onClick={handleProcessData} disabled={processing}>
                {processing ? 'Processing...' : processingResult ? 'Data Processing Complete' : 'Start Data Processing'}
              </button>
            )}
          </div>

          {processingError && (
            <div className={styles.errorMessage}>
              <span className={`${styles.icon} material-symbols-outlined`}>error</span>
              <p>{processingError}</p>
            </div>
          )}

          {processingResult && (
            <div className={styles.processingMessage}>
              <span className={`${styles.icon} material-symbols-outlined`}>check_circle</span>
              <p>
                Processing complete. Run ID: <strong>{processingResult.jobId}</strong> • Status: <strong>{processingResult.status}</strong>
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default Uploads
