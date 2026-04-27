import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { formatPhoneNumber, displayPhoneNumber, COUNTRY_CODES, getPhoneExample } from '../../lib/phone-utils';
import { cn } from './utils';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  showCountrySelector?: boolean;
  defaultCountryCode?: string;
  error?: string;
}

export function PhoneInput({
  value,
  onChange,
  label,
  placeholder,
  required = false,
  disabled = false,
  className,
  showCountrySelector = true,
  defaultCountryCode = COUNTRY_CODES.INDONESIA,
  error
}: PhoneInputProps) {
  const [countryCode, setCountryCode] = useState(defaultCountryCode);
  const [localValue, setLocalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Parse initial value
  useEffect(() => {
    if (value) {
      // Extract country code and local number from stored value
      const cleanValue = value.replace(/\D/g, '');

      // Try to detect country code
      const codes = Object.values(COUNTRY_CODES).sort((a, b) => b.length - a.length);
      let detectedCode = defaultCountryCode;
      let local = cleanValue;

      for (const code of codes) {
        if (cleanValue.startsWith(code)) {
          detectedCode = code;
          local = cleanValue.substring(code.length);
          break;
        }
      }

      setCountryCode(detectedCode);
      setLocalValue(local);
    } else {
      setLocalValue('');
    }
  }, [value, defaultCountryCode]);

  const handleLocalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;

    // Remove all non-numeric characters
    input = input.replace(/\D/g, '');

    // Remove leading zero if present (0813... -> 813...)
    while (input.startsWith('0')) {
      input = input.substring(1);
    }

    // Remove country code if user pastes full number (62813... -> 813...)
    if (input.startsWith(countryCode)) {
      input = input.substring(countryCode.length);
    }

    // Also handle other common country codes user might paste
    const otherCodes = Object.values(COUNTRY_CODES).filter(code => code !== countryCode);
    for (const code of otherCodes) {
      if (input.startsWith(code)) {
        input = input.substring(code.length);
        break;
      }
    }

    // Limit length (max 13 digits for local number)
    if (input.length > 13) {
      input = input.substring(0, 13);
    }

    setLocalValue(input);

    // Construct full phone number
    const fullNumber = input ? countryCode + input : '';

    // Validate
    if (input) {
      const result = formatPhoneNumber(fullNumber, countryCode);
      if (!result.isValid && result.error) {
        setValidationError(result.error);
      } else {
        setValidationError('');
      }
    } else {
      setValidationError('');
    }

    // Always call onChange with the formatted value
    onChange(fullNumber);
  };

  const handleCountryCodeChange = (newCode: string) => {
    setCountryCode(newCode);

    // Update full number with new country code
    if (localValue) {
      const fullNumber = newCode + localValue;
      onChange(fullNumber);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);

    // Final validation on blur
    if (localValue) {
      const fullNumber = countryCode + localValue;
      const result = formatPhoneNumber(fullNumber, countryCode);

      if (!result.isValid && result.error) {
        setValidationError(result.error);
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setValidationError('');
  };

  const example = getPhoneExample(countryCode);
  const exampleLocal = example.substring(countryCode.length);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <div className="flex gap-2">
        {showCountrySelector && (
          <Select value={countryCode} onValueChange={handleCountryCodeChange} disabled={disabled}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={COUNTRY_CODES.INDONESIA}>+62 🇮🇩</SelectItem>
              <SelectItem value={COUNTRY_CODES.MALAYSIA}>+60 🇲🇾</SelectItem>
              <SelectItem value={COUNTRY_CODES.SINGAPORE}>+65 🇸🇬</SelectItem>
              <SelectItem value={COUNTRY_CODES.THAILAND}>+66 🇹🇭</SelectItem>
              <SelectItem value={COUNTRY_CODES.PHILIPPINES}>+63 🇵🇭</SelectItem>
              <SelectItem value={COUNTRY_CODES.VIETNAM}>+84 🇻🇳</SelectItem>
            </SelectContent>
          </Select>
        )}

        <div className="flex-1 relative">
          <Input
            type="tel"
            value={localValue}
            onChange={handleLocalNumberChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder || exampleLocal}
            disabled={disabled}
            className={cn(
              (validationError || error) && 'border-red-500 focus:ring-red-500'
            )}
          />
        </div>
      </div>

      {(validationError || error) && (
        <p className="text-xs text-red-500">{validationError || error}</p>
      )}
    </div>
  );
}
