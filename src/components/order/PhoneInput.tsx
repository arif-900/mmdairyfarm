import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertCircle } from "lucide-react";

interface PhoneInputProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  disabled?: boolean;
}

// Indian mobile number validation
const validateIndianMobile = (phone: string): { isValid: boolean; message: string } => {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, "");
  
  // Check if empty
  if (!digits) {
    return { isValid: false, message: "" };
  }

  // Must be exactly 10 digits
  if (digits.length !== 10) {
    return { isValid: false, message: "Must be 10 digits" };
  }

  // Must start with valid Indian mobile prefix (6, 7, 8, or 9)
  if (!/^[6-9]/.test(digits)) {
    return { isValid: false, message: "Must start with 6, 7, 8, or 9" };
  }

  // Check for obviously invalid patterns (all same digits, sequential)
  if (/^(\d)\1{9}$/.test(digits)) {
    return { isValid: false, message: "Invalid phone number" };
  }

  // Check for test numbers
  if (["1234567890", "0123456789", "9876543210", "0000000000"].includes(digits)) {
    return { isValid: false, message: "Please enter a real phone number" };
  }

  return { isValid: true, message: "Valid number" };
};

const PhoneInput = ({ value, onChange, disabled }: PhoneInputProps) => {
  const [touched, setTouched] = useState(false);
  
  const validation = validateIndianMobile(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    const newValidation = validateIndianMobile(digits);
    onChange(digits, newValidation.isValid);
  };

  const handleBlur = () => {
    setTouched(true);
  };

  return (
    <div className="space-y-1">
      <Label htmlFor="mobile">Mobile Number *</Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
          +91
        </div>
        <Input
          id="mobile"
          type="tel"
          placeholder="Enter 10-digit mobile number"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className="pl-12 pr-10"
          maxLength={10}
          inputMode="numeric"
          pattern="[0-9]*"
          required
        />
        {value.length === 10 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {validation.isValid ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-destructive" />
            )}
          </div>
        )}
      </div>
      {touched && value && !validation.isValid && validation.message && (
        <p className="text-xs text-destructive">{validation.message}</p>
      )}
      {value.length === 10 && validation.isValid && (
        <p className="text-xs text-green-600">✓ Valid mobile number</p>
      )}
    </div>
  );
};

export default PhoneInput;
