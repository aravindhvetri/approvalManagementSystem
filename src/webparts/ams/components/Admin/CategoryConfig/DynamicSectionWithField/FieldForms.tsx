// FieldForm.jsx
import React from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import { InputSwitch } from "primereact/inputswitch";
import { MdCancel } from "react-icons/md";
import { LuPlus } from "react-icons/lu";
import { Label } from "@fluentui/react";

const FieldForms = ({
  newField,
  setNewField,
  columnTypes,
  approvalStage,
  isValidation,
  newChoice,
  setNewChoice,
  choiceError,
  setChoiceError,
  handleChoiceAdded,
  handleCancelField,
  FieldValidateFunc,
  handleSaveField,
  DynamicSectionWithFieldStyles,
}) => {
  return (
    <div className={DynamicSectionWithFieldStyles.addFieldContainer}>
      <div className={DynamicSectionWithFieldStyles.inlineFieldForm}>
        {/* Name Field */}
        <div className={DynamicSectionWithFieldStyles.columnNameContainer}>
          <Label className={DynamicSectionWithFieldStyles.label}>Name</Label>
          <InputText
            value={newField.name}
            onChange={(e) => setNewField({ ...newField, name: e.target.value })}
            placeholder="Enter name"
            className={`${DynamicSectionWithFieldStyles.columnNameInput} inputField`}
            maxLength={25}
          />
          {isValidation && !newField?.name && (
            <span className="errorMsg">Field Name is required</span>
          )}
        </div>

        {/* Type Field */}
        <div className={DynamicSectionWithFieldStyles.columnNameContainer}>
          <Label className={DynamicSectionWithFieldStyles.label}>Type</Label>
          <Dropdown
            value={newField.type}
            options={columnTypes}
            onChange={(e) => {
              const newType = e.value;
              setNewField({
                ...newField,
                type: newType,
                required: newType === "YesorNo" ? false : newField?.required,
                choices: newType === "Choice" ? [] : [],
              });
              if (newType !== "Choice") setNewChoice("");
            }}
            optionLabel="name"
            placeholder="Select Type"
            className={`${DynamicSectionWithFieldStyles.columnNameInput} inputField`}
          />
          {isValidation && !newField?.type && (
            <span className="errorMsg">Field type is required</span>
          )}
        </div>

        {/* Stages Field */}
        <div className={DynamicSectionWithFieldStyles.columnNameContainer}>
          <Label className={DynamicSectionWithFieldStyles.label}>
            Need to show on
          </Label>
          <MultiSelect
            value={newField.stages}
            options={approvalStage.map((stage) => ({
              label: stage,
              value: stage,
            }))}
            display="chip"
            onChange={(e) => setNewField({ ...newField, stages: e.value })}
            placeholder="Select Stages"
            className={`${DynamicSectionWithFieldStyles.columnNameInput} inputField`}
          />
          {isValidation && newField?.stages.length == 0 && (
            <span className="errorMsg">Field stage is required</span>
          )}
        </div>

        {/* Choice Field */}
        {newField.type === "Choice" && (
          <div className={DynamicSectionWithFieldStyles.choiceContainer}>
            <div>
              <InputText
                value={newChoice}
                onChange={(e) => {
                  setNewChoice(e.target.value);
                  if (e.target.value.trim() !== "") setChoiceError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleChoiceAdded();
                }}
                placeholder="Enter new choice"
                className={`${DynamicSectionWithFieldStyles.choiceInput} inputField`}
              />
              {choiceError && (
                <span className="errorMsg">Choice cannot be empty</span>
              )}
            </div>
            <Button
              label="Add Choice"
              icon={<LuPlus />}
              onClick={handleChoiceAdded}
              className={DynamicSectionWithFieldStyles.addButton}
            />
          </div>
        )}
      </div>

      {/* Choice List */}
      <div className={DynamicSectionWithFieldStyles.choiceListContainer}>
        {newField?.choices?.map((choice, index) => (
          <div key={index} className={DynamicSectionWithFieldStyles.choiceItem}>
            <span>{choice}</span>
            <MdCancel
              className={DynamicSectionWithFieldStyles.deleteChoiceBtn}
              onClick={() => {
                const updatedChoices = newField.choices.filter(
                  (c, i) => i !== index
                );
                setNewField({ ...newField, choices: updatedChoices });
              }}
            />
          </div>
        ))}
      </div>

      {/* Is Required */}
      {!(newField.type === "YesorNo") && (
        <div className={DynamicSectionWithFieldStyles.columnNameContainer}>
          <Label className={DynamicSectionWithFieldStyles.label}>
            Is require
          </Label>
          <InputSwitch
            checked={newField.required}
            onChange={(e) => setNewField({ ...newField, required: e.value })}
            className="InputSwitch"
          />
        </div>
      )}

      {/* Buttons */}
      <div className={DynamicSectionWithFieldStyles.dialogButtons}>
        <Button
          label="Cancel"
          onClick={handleCancelField}
          className="customCancelButton"
        />
        <Button
          label="Save"
          onClick={async () => {
            const isValid = await FieldValidateFunc();
            if (isValid) {
              handleSaveField();
            }
          }}
          className="customSubmitButton"
          disabled={choiceError}
        />
      </div>
    </div>
  );
};

export default FieldForms;
