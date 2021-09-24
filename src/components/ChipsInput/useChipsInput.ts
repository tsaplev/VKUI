import * as React from 'react';

export type ChipsInputValue = string | number;

export interface ChipsInputOption {
  value?: ChipsInputValue;
  label?: string;
  [otherProp: string]: any;
}

export interface UseChipsInputParams<Option extends ChipsInputOption> {
  value: Option[];
  inputValue?: string;
  onChange?: (o: Option[]) => void;
  onInputChange?: (e?: React.ChangeEvent<HTMLInputElement>) => void;
  getOptionValue?: (o?: Option) => ChipsInputValue;
  getOptionLabel?: (o?: Option) => string;
  getNewOptionData?: (v?: ChipsInputValue, l?: string) => Option;
}

export const useChipsInput = <Option extends ChipsInputOption>(props: UseChipsInputParams<Option>) => {
  const { value, getOptionValue, onChange, onInputChange, getNewOptionData } = props;

  const [fieldValue, setFieldValue] = React.useState(props.inputValue);
  const [selectedOptions, setSelectedOptions] = React.useState(value);

  const clearInput = React.useCallback(() => {
    setFieldValue('');
    onInputChange({ target: { value: '' } } as any);
  }, [onInputChange]);

  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldValue(e.target.value);
    onInputChange(e);
  }, [onInputChange]);

  const toggleOption = React.useCallback((newOption: Option, value?: boolean) => {
    const newSelectedOptions = selectedOptions.filter((option: Option) => getOptionValue(newOption) !== getOptionValue(option));

    if (value === true) {
      newSelectedOptions.push(newOption);
    }

    setSelectedOptions(newSelectedOptions);
    onChange(newSelectedOptions);
  }, [selectedOptions, getOptionValue, onChange]);

  const addOption = React.useCallback((newOption: Option) => toggleOption(newOption, true), [toggleOption]);
  const addOptionFromInput = React.useCallback(() => {
    const trimmedValue = fieldValue?.trim();

    if (trimmedValue) {
      addOption(getNewOptionData(undefined, trimmedValue));
      clearInput();
    }
  }, [addOption, clearInput, getNewOptionData, fieldValue]);
  const removeOption = React.useCallback((value: ChipsInputValue) => {
    toggleOption(getNewOptionData(undefined, value as string), false);
  }, [toggleOption, getNewOptionData]);

  React.useEffect(() => {
    setSelectedOptions(value);

    return () => setSelectedOptions([]);
  }, [props.value]);

  React.useEffect(() => {
    setFieldValue(props.inputValue);

    return () => setFieldValue('');
  }, [props.inputValue]);

  return { fieldValue, setFieldValue, selectedOptions, setSelectedOptions, clearInput, toggleOption, addOption, addOptionFromInput, removeOption, handleInputChange };
};
