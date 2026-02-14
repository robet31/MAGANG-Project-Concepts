'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, CheckCircle2, Upload, FileSpreadsheet, Loader2, X, Trash2, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface Restaurant {
  id: string
  name: string
  code: string
}

interface UploadError {
  row: number
  column: string
  message: string
  severity: string
}

interface RestaurantInfo {
  id: string
  name: string
  code: string
}

interface UploadResultData {
  totalRows: number
  validRows: number
  invalidRows: number
  qualityScore: number
  errors: UploadError[]
  restaurant?: RestaurantInfo
  restaurants?: { restaurantName: string; restaurantId: string; success: number; failed: number }[]
}

export default function UploadPage() {
  const { data: session } = useSession()
  const [file, setFile] = useState<File | null>(null)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    data?: UploadResultData
  } | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ restaurantId?: string; restaurantName?: string } | null>(null)

  const userRole = (session?.user as any)?.role
  const isSuperAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'

  useEffect(() => {
    fetchRestaurants()
  }, [])

  const fetchRestaurants = async () => {
    try {
      const res = await fetch('/api/upload')
      if (res.ok) {
        const data = await res.json()
        setRestaurants(data)
        if (data.length === 1 && !isSuperAdmin) {
          setSelectedRestaurant(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      setResult(null)
      setUploadProgress(0)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024
  })

  const handleUpload = async () => {
    if (!file) return
    
    // For non-super admin, require restaurant selection
    if (!isSuperAdmin && !selectedRestaurant) return

    setIsLoading(true)
    setResult(null)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('file', file)
    if (selectedRestaurant) {
      formData.append('restaurantId', selectedRestaurant)
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      
      // Simulate progress for better UX
      setUploadProgress(100)
      
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: 'Terjadi kesalahan saat upload'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setResult(null)
    setUploadProgress(0)
  }

  const handleDeleteAll = async () => {
    setIsDeleting(true)
    try {
      const url = deleteTarget?.restaurantId 
        ? `/api/delivery-data?restaurantId=${deleteTarget.restaurantId}`
        : '/api/delivery-data'
      
      const res = await fetch(url, { method: 'DELETE' })
      const data = await res.json()
      
      if (res.ok) {
        setResult({
          success: true,
          message: data.message || 'Data berhasil dihapus'
        })
      } else {
        setResult({
          success: false,
          message: data.error || 'Gagal menghapus data'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Terjadi kesalahan saat menghapus data'
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setDeleteTarget(null)
    }
  }

  const openDeleteDialog = (restaurantId?: string, restaurantName?: string) => {
    setDeleteTarget({ restaurantId, restaurantName })
    setShowDeleteDialog(true)
  }

  // Calculate success percentage
  const getSuccessPercentage = () => {
    if (!result?.data) return 0
    if (result.data.totalRows === 0) return 0
    return Math.round((result.data.validRows / result.data.totalRows) * 100)
  }

  // Get quality color
  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 70) return 'text-yellow-500'
    return 'text-red-500'
  }

  // Get quality bg color
  const getQualityBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          Upload Data
        </h1>
        <p style={{ color: 'var(--muted-foreground)' }}>
          Upload data delivery pizza dari Excel
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Card */}
        <Card style={{ backgroundColor: 'var(--card)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--card-foreground)' }}>
              File Excel
            </CardTitle>
            <CardDescription style={{ color: 'var(--muted-foreground)' }}>
              Upload file .xlsx, .xls, atau .csv (max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Restaurant Select - Hidden for Super Admin */}
            {!isSuperAdmin && (
              <div className="space-y-2">
                <Label htmlFor="restaurant" style={{ color: 'var(--foreground)' }}>
                  Restoran
                </Label>
                <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                  <SelectTrigger style={{ 
                    backgroundColor: 'var(--input)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}>
                    <SelectValue placeholder="Pilih restoran" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants.map((restaurant) => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        {restaurant.name} ({restaurant.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Super Admin Info */}
            {isSuperAdmin && (
              <div 
                className="p-3 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-foreground)'
                }}
              >
                <p className="text-sm">
                  <strong>Mode Super Admin:</strong> Anda dapat upload data untuk semua restoran. 
                  Sistem akan otomatis mendeteksi restoran dari data Excel.
                </p>
              </div>
            )}

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors"
              )}
              style={{
                borderColor: isDragActive ? 'var(--primary)' : 'var(--border)',
                backgroundColor: isDragActive ? 'var(--accent)' : 'transparent'
              }}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet 
                    className="h-10 w-10" 
                    style={{ color: 'var(--primary)' }}
                  />
                  <div className="text-left">
                    <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                      {file.name}
                    </p>
                    <p style={{ color: 'var(--muted-foreground)' }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile()
                    }}
                    style={{ color: 'var(--destructive)' }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload 
                    className="h-10 w-10 mx-auto mb-3" 
                    style={{ color: 'var(--muted-foreground)' }}
                  />
                  <p style={{ color: 'var(--foreground)' }}>
                    {isDragActive
                      ? "Lepaskan file di sini..."
                      : "Drag & drop file Excel di sini"}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    atau klik untuk memilih file
                  </p>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {isLoading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--foreground)' }}>Mengupload...</span>
                  <span style={{ color: 'var(--primary)' }}>{uploadProgress}%</span>
                </div>
                <div 
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--muted)' }}
                >
                  <div 
                    className="h-full transition-all duration-300"
                    style={{ 
                      width: `${uploadProgress}%`,
                      backgroundColor: 'var(--primary)'
                    }}
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || (!isSuperAdmin && !selectedRestaurant) || isLoading}
              className="w-full"
              style={{ 
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengupload...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result Card */}
        <Card style={{ backgroundColor: 'var(--card)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--card-foreground)' }}>
              Hasil Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!result && (
              <div className="text-center py-12" style={{ color: 'var(--muted-foreground)' }}>
                <Upload className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Belum ada file yang diupload</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Success/Error Banner */}
                <div 
                  className="flex items-center gap-3 p-4 rounded-lg"
                  style={{
                    backgroundColor: result.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: result.success ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
                  }}
                >
                  {result.success ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <AlertCircle className="h-6 w-6" />
                  )}
                  <div>
                    <p className="font-medium">{result.message}</p>
                  </div>
                </div>

                {result.data && (
                  <>
                    {/* Restaurant Info */}
                    {result.data.restaurant && (
                      <div 
                        className="p-3 rounded-lg"
                        style={{ 
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        }}
                      >
                        <p className="text-sm font-medium" style={{ color: 'rgb(59, 130, 246)' }}>
                          Uploaded to: {result.data.restaurant.name} ({result.data.restaurant.code})
                        </p>
                      </div>
                    )}

                    {/* Multiple Restaurants */}
                    {result.data.restaurants && result.data.restaurants.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                          Data uploaded to:
                        </p>
                        {result.data.restaurants.map((rest, i) => (
                          <div 
                            key={i}
                            className="p-3 rounded-lg flex justify-between items-center"
                            style={{ 
                              backgroundColor: rest.success > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            }}
                          >
                            <span style={{ color: rest.success > 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)' }}>
                              {rest.restaurantName}
                            </span>
                            <span className="text-sm font-medium">
                              {rest.success} rows
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Stats Grid */}
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div 
                        className="text-center p-4 rounded-lg"
                        style={{ backgroundColor: 'var(--muted)' }}
                      >
                        <p className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                          {result.data.totalRows}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                          Total Baris
                        </p>
                      </div>
                      <div 
                        className="text-center p-4 rounded-lg"
                        style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                      >
                        <p className="text-3xl font-bold text-green-600">
                          {result.data.validRows}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                          Berhasil
                        </p>
                      </div>
                    </div>

                    {/* Success Percentage */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                          Tingkat Keberhasilan
                        </span>
                        <span 
                          className="text-lg font-bold"
                          style={{ 
                            color: getSuccessPercentage() >= 90 ? 'rgb(34, 197, 94)' : 
                                   getSuccessPercentage() >= 70 ? 'rgb(234, 179, 8)' : 'rgb(239, 68, 68)'
                          }}
                        >
                          {getSuccessPercentage()}%
                        </span>
                      </div>
                      <div 
                        className="w-full h-3 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--muted)' }}
                      >
                        <div 
                          className="h-full transition-all duration-500 rounded-full"
                          style={{ 
                            width: `${getSuccessPercentage()}%`,
                            backgroundColor: getSuccessPercentage() >= 90 ? 'rgb(34, 197, 94)' : 
                                            getSuccessPercentage() >= 70 ? 'rgb(234, 179, 8)' : 'rgb(239, 68, 68)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Quality Score */}
                    <div 
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      <div className="flex justify-between items-center">
                        <span style={{ color: 'var(--accent-foreground)' }}>
                          Quality Score
                        </span>
                        <span 
                          className="text-xl font-bold"
                          style={{ color: 'var(--primary)' }}
                        >
                          {result?.data?.qualityScore?.toFixed(1) ?? '0'}%
                        </span>
                      </div>
                    </div>

                    {/* Error Summary */}
                    {result.data.invalidRows > 0 && (
                      <div 
                        className="p-3 rounded-lg"
                        style={{ 
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: 'rgb(239, 68, 68)'
                        }}
                      >
                        <p className="font-medium">
                          {result.data.invalidRows} baris gagal diupload
                        </p>
                      </div>
                    )}

                    {/* Errors List */}
                    {result.data.errors && result.data.errors.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                          Error yang ditemukan:
                        </p>
                        <div 
                          className="max-h-48 overflow-y-auto space-y-1 rounded-lg p-2"
                          style={{ backgroundColor: 'var(--muted)' }}
                        >
                          {result.data.errors.slice(0, 10).map((error, i) => (
                            <div
                              key={i}
                              className="text-sm p-2 rounded"
                              style={{
                                backgroundColor: error.severity === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                                color: error.severity === 'error' ? 'rgb(239, 68, 68)' : 'rgb(234, 179, 8)'
                              }}
                            >
                              <span className="font-medium">Baris {error.row}</span>
                              {error.column && (
                                <span style={{ color: 'var(--muted-foreground)' }}> - {error.column}</span>
                              )}
                              : {error.message}
                            </div>
                          ))}
                        </div>
                        {result.data.errors.length > 10 && (
                          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            ...dan {result.data.errors.length - 10} error lainnya
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card 
        className="border-l-4"
        style={{ 
          backgroundColor: 'var(--accent)',
          borderLeftColor: 'var(--primary)'
        }}
      >
        <CardContent className="p-4">
          <h3 
            className="font-medium mb-2"
            style={{ color: 'var(--accent-foreground)' }}
          >
            Format Data yang Diharapkan
          </h3>
          <div 
            className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm"
            style={{ color: 'var(--accent-foreground)' }}
          >
            <div>• Order ID (ORD001)</div>
            <div>• Restaurant Name</div>
            <div>• Location</div>
            <div>• Order Time</div>
            <div>• Delivery Time</div>
            <div>• Delivery Duration</div>
            <div>• Pizza Size</div>
            <div>• Pizza Type</div>
            <div>• Payment Method</div>
            <div>• Distance (km)</div>
            <div>• Traffic Level</div>
            <div>• Is Peak Hour</div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Data Section - GM Only */}
      {userRole === 'GM' && (
        <Card 
          className="border-l-4 border-red-500"
          style={{ 
            backgroundColor: 'var(--card)',
          }}
        >
          <CardHeader>
            <CardTitle style={{ color: 'var(--card-foreground)' }} className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Hapus Data
            </CardTitle>
            <CardDescription style={{ color: 'var(--muted-foreground)' }}>
              Hapus semua data delivery. Tindakan ini tidak dapat dibatalkan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="destructive"
                onClick={() => openDeleteDialog()}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus Semua Data
              </Button>
              
              {restaurants.map((restaurant) => (
                <Button
                  key={restaurant.id}
                  variant="outline"
                  onClick={() => openDeleteDialog(restaurant.id, restaurant.name)}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus: {restaurant.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Konfirmasi Hapus Data
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus {deleteTarget?.restaurantName ? `data untuk ${deleteTarget.restaurantName}` : 'semua data delivery'}?
              <br /><br />
              <strong className="text-red-500">Tindakan ini tidak dapat dibatalkan!</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Data
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
