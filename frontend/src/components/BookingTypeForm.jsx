import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'

const colorOptions = [
  { value: '#0071e3', name: 'Blue' },     // Primary blue
  { value: '#5e5ce6', name: 'Indigo' },   // Secondary indigo
  { value: '#00c28c', name: 'Emerald' },  // Accent emerald
  { value: '#ff3a30', name: 'Red' },      // Error red
  { value: '#ff9500', name: 'Orange' },   // Warning orange
  { value: '#34c759', name: 'Green' },    // Success green
  { value: '#af52de', name: 'Purple' },   // Purple
  { value: '#ff2d55', name: 'Pink' },     // Pink
]

const durationOptions = [15, 30, 45, 60, 90, 120]

export default function BookingTypeForm({ 
  onSubmit, 
  onCancel, 
  initialData = null, 
  isSubmitting = false 
}) {
  const [selectedColor, setSelectedColor] = useState(initialData?.color || colorOptions[0].value)
  
  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors } 
  } = useForm({
    defaultValues: initialData || {
      name: '',
      description: '',
      duration: 30,
      color: colorOptions[0].value,
    }
  })
  
  const handleFormSubmit = (data) => {
    onSubmit({ ...data, color: selectedColor })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
          Booking Type Name
        </label>
        <input
          id="name"
          type="text"
          className={`w-full ${errors.name ? 'border-error-500 focus:ring-error-500' : ''}`}
          {...register('name', { required: 'Name is required' })}
          placeholder="e.g., Initial Consultation"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
          Description (Optional)
        </label>
        <textarea
          id="description"
          rows={3}
          className="w-full"
          {...register('description')}
          placeholder="Brief description of this meeting type"
        />
      </div>
      
      <div>
        <label htmlFor="duration" className="block text-sm font-medium text-neutral-700 mb-1">
          Duration
        </label>
        <select
          id="duration"
          className={`w-full ${errors.duration ? 'border-error-500 focus:ring-error-500' : ''}`}
          {...register('duration', { required: 'Duration is required' })}
        >
          {durationOptions.map((option) => (
            <option key={option} value={option}>
              {option} minutes
            </option>
          ))}
        </select>
        {errors.duration && (
          <p className="mt-1 text-sm text-error-600">{errors.duration.message}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Color
        </label>
        <div className="flex flex-wrap gap-3">
          {colorOptions.map((color) => (
            <motion.button
              key={color.value}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedColor(color.value)}
              className={`w-8 h-8 rounded-full transition-all ${
                selectedColor === color.value ? 'ring-2 ring-offset-2 ring-neutral-400' : ''
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>
      
      <div className="pt-4 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-outline"
        >
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className={`btn btn-primary ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {initialData ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            initialData ? 'Update Booking Type' : 'Create Booking Type'
          )}
        </button>
      </div>
    </form>
  )
}