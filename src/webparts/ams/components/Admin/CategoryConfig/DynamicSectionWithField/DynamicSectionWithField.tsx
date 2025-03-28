//Default Imports:
import * as React from "react";
import { useState, useEffect } from "react";
//PrimeReact Imports:
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Checkbox } from "primereact/checkbox";
import { IoIosAddCircle } from "react-icons/io";
import { InputSwitch } from "primereact/inputswitch";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { TbEdit } from "react-icons/tb";
import { RiDeleteBinLine } from "react-icons/ri";
import { IoMdEye } from "react-icons/io";
import { InputTextarea } from "primereact/inputtextarea";
//Styles Imports:
import DynamicSectionWithFieldStyles from "./DynamicSectionWithField.module.scss";
import "../../../../../../External/style.css";
import "./DynamicSectionWithField.css";
//Common Service Imports:
import { Config } from "../../../../../../CommonServices/Config";
import {
  columnTypes,
  stageBodyTemplate,
} from "../../../../../../CommonServices/CommonTemplates";
import { Label } from "office-ui-fabric-react";
import {
  IFinalSubmitDetails,
  INextStageFromCategorySideBar,
} from "../../../../../../CommonServices/interface";
import { sp } from "@pnp/sp";

const DynamicSectionWithField = ({
  setNextStageFromCategory,
  setSelectedApprover,
  setDynamicSectionWithFieldSideBarVisible,
  setFinalSubmit,
}) => {
  const [sections, setSections] = useState([]);
  console.log(sections, "sections");
  const [showPopup, setShowPopup] = useState(false);
  const [newChoice, setNewChoice] = useState("");
  const [newField, setNewField] = useState<any>({
    sectionIndex: null,
    name: "",
    type: null,
    required: false,
    stages: [],
    choices: [],
  });
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFields, setPreviewFields] = useState<any>([]);

  const addDynamicSection = () => {
    setSections([...sections, { name: "", columns: [] }]);
  };

  const handleSaveField = () => {
    const updatedSections = [...sections];
    if (newField.sectionIndex !== null) {
      if (newField.rowIndex !== undefined) {
        // Update existing field
        updatedSections[newField.sectionIndex].columns[newField.rowIndex] = {
          name: newField.name,
          type: newField.type,
          required: newField.required,
          stages: newField.stages,
          choices: newField.type === "Choice" ? newField.choices : [],
        };
      } else {
        // Add new field
        updatedSections[newField.sectionIndex].columns.push({
          name: newField.name,
          type: newField.type,
          required: newField.required,
          stages: newField.stages,
          choices: newField.type === "Choice" ? newField.choices : [],
        });
      }
      setSections(updatedSections);
    }

    // Reset state:
    setNewField({
      sectionIndex: null,
      name: "",
      type: null,
      required: false,
      stages: [],
      choices: [],
      rowIndex: undefined,
    });
    setShowPopup(false);
  };

  const RequiredBodyTemplate = (rowData) => {
    return <div>{rowData?.required ? "Yes" : "No"}</div>;
  };

  const ActionBodyTemplate = (rowData, sectionIndex, rowIndex) => {
    return (
      <div className={DynamicSectionWithFieldStyles.ActionIconsContainer}>
        <div style={{ color: "#0095ff", cursor: "pointer" }}>
          <TbEdit
            onClick={() => handleEditField(rowData, sectionIndex, rowIndex)}
          />
        </div>
        <div style={{ color: "#ff0000", cursor: "pointer" }}>
          <RiDeleteBinLine
            onClick={() => handleDeleteField(sectionIndex, rowIndex)}
          />
        </div>
      </div>
    );
  };

  const handleEditField = (rowData, sectionIndex, rowIndex) => {
    setNewField({
      ...rowData,
      sectionIndex,
      rowIndex,
    });
    setShowPopup(true);
  };

  const handleDeleteField = (sectionIndex, rowIndex) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].columns.splice(rowIndex, 1);
    setSections(updatedSections);
  };

  const handlePreview = (sectionIndex) => {
    setPreviewFields({
      sectionName: sections[sectionIndex].name,
      columns: sections[sectionIndex].columns,
    });
    setPreviewVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const list = sp.web.lists.getByTitle("RequestsHub");

      // Loop through sections and columns
      for (const section of sections) {
        for (const column of section.columns) {
          let fieldTypeKind = 0;
          let columnName = column.name;
          let columnType = column.type;
          let choicesArray = column.choices || []; // Handle choices

          // Check column type and assign appropriate values
          if (columnType === "text") {
            fieldTypeKind = 2; // Text type
          } else if (columnType === "textarea") {
            fieldTypeKind = 3; // Multiple lines of text
          } else if (columnType === "Choice") {
            fieldTypeKind = 6; // Choice type
          } else {
            console.log("Invalid column type:", columnType);
            continue;
          }

          // Add column to SharePoint list
          await addColumnToList(list, fieldTypeKind, columnName, choicesArray);
        }
      }

      alert("Columns added successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while adding the columns.");
    }
  };

  // Function to add columns based on type
  const addColumnToList = async (list, fieldTypeKind, columnName, choices) => {
    try {
      if (fieldTypeKind === 2) {
        await list.fields.addText(columnName); // For Single Line Text
      } else if (fieldTypeKind === 3) {
        await list.fields.addMultilineText(columnName); // For Multiple Lines of Text
      } else if (fieldTypeKind === 6) {
        await list.fields.addChoice(columnName, choices); // Pass choices array directly
      }
    } catch (error) {
      console.error(`Error adding column ${columnName}:`, error);
    }
  };

  useEffect(() => {
    const storedSections = sessionStorage.getItem("dynamicSections");
    if (storedSections) {
      setSections(JSON.parse(storedSections));
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("dynamicSections", JSON.stringify(sections));
    setFinalSubmit((prev: IFinalSubmitDetails) => ({
      ...prev,
      dynamicSectionWithField: sections,
    }));
  }, [sections]);

  return (
    <>
      <div className={DynamicSectionWithFieldStyles.heading}>Fields</div>
      <div className={`${DynamicSectionWithFieldStyles.container} container`}>
        <Button
          icon={
            <IoIosAddCircle
              className={DynamicSectionWithFieldStyles.addSectionBtnIcon}
            />
          }
          label="Add Section"
          onClick={addDynamicSection}
          className={DynamicSectionWithFieldStyles.addButton}
        />
        {sections.map((section, sectionIndex) => (
          <div
            key={sectionIndex}
            className={DynamicSectionWithFieldStyles.sectionContainer}
          >
            <Label className={DynamicSectionWithFieldStyles.label}>
              Section name
            </Label>
            <InputText
              value={section.name}
              onChange={(e) => {
                const updatedSections = [...sections];
                updatedSections[sectionIndex].name = e.target.value;
                setSections(updatedSections);
              }}
              placeholder="Enter here"
              className={DynamicSectionWithFieldStyles.sectionInput}
            />
            {section.columns?.length > 0 ? (
              <div className="customDataTableContainer">
                <DataTable
                  value={section.columns}
                  emptyMessage={
                    <>
                      <p style={{ textAlign: "center" }}>No Records Found</p>
                    </>
                  }
                >
                  <Column header="Name" field="name"></Column>
                  <Column header="Type" field="type"></Column>
                  <Column
                    header="Required"
                    body={RequiredBodyTemplate}
                  ></Column>
                  <Column
                    header="Approver"
                    body={(row) => stageBodyTemplate(row)}
                  ></Column>
                  <Column
                    header="Action"
                    body={(row, { rowIndex }) =>
                      ActionBodyTemplate(row, sectionIndex, rowIndex)
                    }
                  ></Column>
                </DataTable>
              </div>
            ) : (
              ""
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                icon={
                  <IoIosAddCircle
                    className={DynamicSectionWithFieldStyles.addSectionBtnIcon}
                  />
                }
                label="Add Field"
                onClick={() => {
                  setNewField({ ...newField, sectionIndex });
                  setShowPopup(true);
                }}
                className={DynamicSectionWithFieldStyles.addFieldButton}
              />
              {section.columns?.length > 3 ? (
                <Button
                  icon={
                    <IoMdEye
                      className={
                        DynamicSectionWithFieldStyles.addSectionBtnIcon
                      }
                    />
                  }
                  label="preview"
                  onClick={() => handlePreview(sectionIndex)}
                  className={DynamicSectionWithFieldStyles.addButton}
                />
              ) : (
                ""
              )}
            </div>
          </div>
        ))}
        <Dialog
          visible={showPopup}
          onHide={() => setShowPopup(false)}
          header="Create Field"
          className={DynamicSectionWithFieldStyles.dialog}
        >
          <div>
            <div className={DynamicSectionWithFieldStyles.columnNameContainer}>
              <Label className={DynamicSectionWithFieldStyles.label}>
                Name
              </Label>
              <InputText
                value={newField.name}
                onChange={(e) =>
                  setNewField({ ...newField, name: e.target.value })
                }
                placeholder="Enter name"
                className={DynamicSectionWithFieldStyles.columnNameInput}
              />
            </div>
            <div className={DynamicSectionWithFieldStyles.columnNameContainer}>
              <Label className={DynamicSectionWithFieldStyles.label}>
                Type
              </Label>
              <Dropdown
                value={newField.type}
                options={columnTypes}
                onChange={(e) =>
                  setNewField({
                    ...newField,
                    type: e.value,
                    choices: e.value === "Choice" ? [] : newField.choices,
                  })
                }
                optionLabel="name"
                placeholder="Select Type"
                style={{ padding: "4px" }}
                className={DynamicSectionWithFieldStyles.columnNameInput}
              />
            </div>
            <div className={DynamicSectionWithFieldStyles.columnNameContainer}>
              {newField.type === "Choice" && (
                <div className={DynamicSectionWithFieldStyles.choiceContainer}>
                  <InputText
                    value={newChoice}
                    onChange={(e) => setNewChoice(e.target.value)}
                    placeholder="Enter new choice"
                    className={DynamicSectionWithFieldStyles.choiceInput}
                  />
                  <Button
                    label="Add Choice"
                    icon="pi pi-plus"
                    onClick={() => {
                      if (newChoice.trim() !== "") {
                        setNewField({
                          ...newField,
                          choices: [...newField.choices, newChoice],
                        });
                        setNewChoice("");
                      }
                    }}
                    className="customSubmitButton"
                  />
                </div>
              )}
            </div>

            {/* {newField.type === "Choice" && newField.choices.length > 0 && (
              <Dropdown
                value={newField.stages}
                options={newField.choices.map((choice) => ({
                  name: choice,
                  value: choice,
                }))}
                onChange={(e) => setNewField({ ...newField, stages: e.value })}
                optionLabel="name"
                placeholder="Select Choices"
                multiple
              />
            )} */}
            <div className={DynamicSectionWithFieldStyles.columnNameContainer}>
              <Label className={DynamicSectionWithFieldStyles.label}>
                Require that this column contains information
              </Label>
              <InputSwitch
                checked={newField.required}
                onChange={(e) =>
                  setNewField({ ...newField, required: e.value })
                }
                className="InputSwitch"
              />
            </div>
            <div className={DynamicSectionWithFieldStyles.columnNameContainer}>
              <Label className={DynamicSectionWithFieldStyles.label}>
                Need to show on
              </Label>
              {["Stage 1", "Stage 2", "Stage 3", "Stage 4"].map((stage) => (
                <div
                  className={`${DynamicSectionWithFieldStyles.stageContainer} stageContainer`}
                  key={stage}
                >
                  <Checkbox
                    inputId={stage}
                    checked={newField.stages.includes(stage)}
                    onChange={(e) => {
                      const selectedStages = e.checked
                        ? [...newField.stages, stage]
                        : newField.stages.filter((s) => s !== stage);
                      setNewField({ ...newField, stages: selectedStages });
                    }}
                  />
                  <label>{stage}</label>
                </div>
              ))}
            </div>
            <div className={DynamicSectionWithFieldStyles.dialogButtons}>
              <Button
                label="Cancel"
                icon="pi pi-times"
                onClick={() => setShowPopup(false)}
                className="customCancelButton"
              />
              <Button
                label="Save"
                icon="pi pi-save"
                onClick={handleSaveField}
                autoFocus
                className="customSubmitButton"
              />
            </div>
          </div>
        </Dialog>
        <Dialog
          visible={previewVisible}
          onHide={() => setPreviewVisible(false)}
          header="Preview Fields"
          className={DynamicSectionWithFieldStyles.previewDailog}
        >
          <div
            className={DynamicSectionWithFieldStyles.previewFieldSectionName}
          >
            {previewFields?.sectionName}
          </div>
          <div className={DynamicSectionWithFieldStyles.previewFieldContainer}>
            {previewFields?.columns?.map((field, index) => (
              <div
                key={index}
                className={DynamicSectionWithFieldStyles.previewField}
              >
                <Label className={DynamicSectionWithFieldStyles.label}>
                  {field.name}
                </Label>
                {field.type === "text" && (
                  <InputText
                    value=""
                    disabled
                    className={DynamicSectionWithFieldStyles.previewInput}
                  />
                )}
                {field.type === "textarea" && (
                  <InputTextarea
                    value=""
                    disabled
                    className={DynamicSectionWithFieldStyles.previewTextArea}
                  />
                )}
                {field.type === "Choice" && (
                  <Dropdown
                    value={null}
                    options={field.choices.map((choice) => ({
                      label: choice,
                      value: choice,
                    }))}
                    // disabled
                    className={DynamicSectionWithFieldStyles.previewDropdown}
                  />
                )}
              </div>
            ))}
          </div>
        </Dialog>
      </div>
      <div className={DynamicSectionWithFieldStyles.FlowButtonsContainer}>
        <div className={DynamicSectionWithFieldStyles.FlowPreviousButton}>
          <Button
            icon="pi pi-angle-double-left"
            label="Previous"
            className="customSubmitButton"
            onClick={() => {
              setNextStageFromCategory({
                ...Config.NextStageFromCategorySideBar,
              });
            }}
          />
        </div>
        <div className={`${DynamicSectionWithFieldStyles.FlowSideBarButtons}`}>
          <Button
            icon="pi pi-times"
            label="Cancel"
            className="customCancelButton"
            onClick={() => {
              setDynamicSectionWithFieldSideBarVisible(false);
              setSelectedApprover("");
              setNextStageFromCategory({
                ...Config.NextStageFromCategorySideBar,
              });
              // sessionStorage.removeItem("dynamicSections");
              sessionStorage.clear();
              setSections([]); // Clear state
            }}
          />

          <Button
            icon="pi pi-angle-double-right"
            label="Next"
            onClick={() => {
              setNextStageFromCategory(
                (prev: INextStageFromCategorySideBar) => ({
                  ...prev,
                  EmailTemplateSection: true,
                  dynamicSectionWithField: false,
                })
              );
            }}
            className="customSubmitButton"
          />
        </div>
      </div>
    </>
  );
};

export default DynamicSectionWithField;
