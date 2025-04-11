//Default Imports:
import * as React from "react";
import { useState, useEffect, useRef } from "react";
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
  toastNotify,
} from "../../../../../../CommonServices/CommonTemplates";
import { Label } from "office-ui-fabric-react";
import {
  IFinalSubmitDetails,
  INextStageFromCategorySideBar,
} from "../../../../../../CommonServices/interface";
import { sp } from "@pnp/sp";
import SPServices from "../../../../../../CommonServices/SPServices";
import { Toast } from "primereact/toast";

const DynamicSectionWithField = ({
  categoryClickingID,
  actionBooleans,
  setNextStageFromCategory,
  setSelectedApprover,
  setDynamicSectionWithFieldSideBarVisible,
  setFinalSubmit,
}) => {
  const toast = useRef<Toast>(null);
  const [sections, setSections] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [newChoice, setNewChoice] = useState("");
  console.log("sections", sections);
  const [newField, setNewField] = useState<any>({
    columnID: null,
    sectionIndex: null,
    name: "",
    type: null,
    required: false,
    stages: [],
    choices: [],
  });
  console.log(newField, "newField");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFields, setPreviewFields] = useState<any>([]);
  const [approvalStage, setApprovalStage] = useState([]);
  const addDynamicSection = () => {
    setSections([...sections, { name: "", sectionID: null, columns: [] }]);
  };
  const [isValidation, setIsValidation] = useState<boolean>(false);
  const [choiceError, setChoiceError] = useState<boolean>(false);
  const [fieldEdit, setFieldEdit] = useState<boolean>(false);

  const handleSaveField = () => {
    const updatedSections = [...sections];
    if (newField.sectionIndex !== null) {
      if (newField.rowIndex !== undefined) {
        // Update existing field
        updatedSections[newField.sectionIndex].columns[newField.rowIndex] = {
          columnID: newField.columnID || null,
          name: newField.name,
          type: newField.type,
          required: newField.required,
          stages: newField.stages,
          choices: newField.type === "Choice" ? newField.choices : [],
        };
      } else {
        // Add new field
        updatedSections[newField.sectionIndex].columns.push({
          columnID: newField.columnID || null,
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
      columnID: null,
      sectionIndex: null,
      name: "",
      type: null,
      required: false,
      stages: [],
      choices: [],
      rowIndex: undefined,
    });
    setShowPopup(false);
    setChoiceError(false);
    setIsValidation(false);
    setFieldEdit(false);
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
    setFieldEdit(true);
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

  //Get CategorySectionConfigDetails:
  const getCategorySectionConfigDetails = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames?.CategorySectionConfig,
      Select: "*",
      Filter: [
        {
          FilterKey: "Category",
          Operator: "eq",
          FilterValue: categoryClickingID.toString(),
        },
        {
          FilterKey: "IsDelete",
          Operator: "eq",
          FilterValue: "false",
        },
      ],
      FilterCondition: "and",
      Orderby: "ID",
      Orderbydecorasc: true,
    })
      .then((res: any) => {

        const tempSectionArr = [];
        res?.forEach(async (section, index) => {
          tempSectionArr.push({
            sectionID: section?.ID,
            name: section?.SectionName,
            columns: await getSectionsColumnsConfig(section?.ID, index),
          });
          setSections([...tempSectionArr]);
        });
      })
      .catch((err) => {
        console.log(err, "Get CategorySectionConfig Details error");
      });
  };

  // Get Sections Columns Config
  const getSectionsColumnsConfig = async (parentSectionID, index) => {
    try {
      const res = await SPServices.SPReadItems({
        Listname: Config.ListNames.SectionColumnsConfig,
        Select: "*,ParentSection/Id",
        Expand: "ParentSection",
        Filter: [
          {
            FilterKey: "ParentSectionId",
            Operator: "eq",
            FilterValue: parentSectionID.toString(),
          },
          {
            FilterKey: "IsDelete",
            Operator: "eq",
            FilterValue: "false",
          },
        ],
        Orderby: "ID",
        Orderbydecorasc: true,
      });
      return res?.flatMap((column: any) => ({
        sectionIndex: index,
        columnID: column?.ID,
        name: column?.ColumnExternalName,
        type:
          column?.ColumnType === "Singleline"
            ? "text"
            : column?.ColumnType === "Multiline"
            ? "textarea"
            : column?.ColumnType,
        required: column?.IsRequired,
        stages: JSON.parse(column?.ViewStage)[0]?.Stage.map(
          (e) => "Stage " + e
        ),
        choices: column?.ChoiceValues
          ? JSON.parse(column?.ChoiceValues)[0]?.Options
          : [],
      }));
    } catch {
      (err) => console.log("getSectionsColumnsConfig error", err);
    }
  };

  //Get Approval Stage Count
  const getApprovalStageCount = async () => {
    var totalStages = 0;
    if (sessionStorage.getItem("approvalFlowDetails")) {
      totalStages = JSON.parse(sessionStorage.getItem("approvalFlowDetails"))
        ?.stages.length;
    } else if (sessionStorage.getItem("selectedFlowID")) {
      const flowID = Number(sessionStorage.getItem("selectedFlowID"));
      await SPServices.SPReadItemUsingID({
        Listname: Config.ListNames.ApprovalConfig,
        SelectedId: flowID,
      })
        .then((res: any) => {
          return (totalStages = res?.TotalStages);
        })
        .catch((err) => console.log("ApprovalConfig get error", err));
    }
    const tempStageArr = [];
    for (let i = 1; i <= totalStages; i++) {
      tempStageArr.push("Stage " + i);
      setApprovalStage([...tempStageArr]);
    }
  };

  useEffect(() => {
    getApprovalStageCount();
    const storedSections = sessionStorage.getItem("dynamicSections");
    if (storedSections) {
      setSections(JSON.parse(storedSections));
    }
    //Handle ReLoad Browser then clear session Storage:
    const handleBeforeUnload = () => {
      sessionStorage.clear();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    sessionStorage.setItem("dynamicSections", JSON.stringify(sections));
    setFinalSubmit((prev: IFinalSubmitDetails) => ({
      ...prev,
      dynamicSectionWithField: sections,
    }));
  }, [sections]);

  useEffect(() => {
    if (categoryClickingID && !sessionStorage.getItem("categoryClickingID")) {
      sessionStorage.setItem("categoryClickingID", categoryClickingID);
      getCategorySectionConfigDetails();
    }
  }, [categoryClickingID]);
  useEffect(() => {
    if (!showPopup) {
      setNewField({
        columnID: null,
        sectionIndex: null,
        name: "",
        type: null,
        required: false,
        stages: [],
        choices: [],
        rowIndex: undefined,
      });
    }
  }, [showPopup]);

  const validateFunction = () => {
    let isValid = true;
    if (sections?.length == 0) {
      isValid = false;
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        content: (prop) =>
          toastNotify({
            iconName: "pi-exclamation-triangle",
            ClsName: "toast-imgcontainer-warning",
            type: "Warning",
            msg: "Atleast one section is required",
          }),
        life: 3000,
      });
    }
    sections.forEach((section) => {
      if (section.name.trim() === "") {
        isValid = false;
        toast.current.show({
          severity: "warn",
          summary: "Warning",
          content: (prop) =>
            toastNotify({
              iconName: "pi-exclamation-triangle",
              ClsName: "toast-imgcontainer-warning",
              type: "Warning",
              msg: "Please enter a section name",
            }),
          life: 3000,
        });
      } else if (section.columns?.length == 0) {
        isValid = false;
        toast.current.show({
          severity: "warn",
          summary: "Warning",
          content: (prop) =>
            toastNotify({
              iconName: "pi-exclamation-triangle",
              ClsName: "toast-imgcontainer-warning",
              type: "Warning",
              msg: "Atleast one Field is required",
            }),
          life: 3000,
        });
      }
    });

    if (isValid) {
      setNextStageFromCategory((prev: INextStageFromCategorySideBar) => ({
        ...prev,
        EmailTemplateSection: true,
        dynamicSectionWithField: false,
      }));
    }
    return isValid;
  };

  const FieldValidateFunc = () => {
    const isDuplicateName = sections
      ?.flatMap((section) => section?.columns || [])
      .some(
        (field) => field.name?.toLowerCase() === newField?.name?.toLowerCase()
      );
    if (isDuplicateName && !fieldEdit) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        content: (prop) =>
          toastNotify({
            iconName: "pi-exclamation-triangle",
            ClsName: "toast-imgcontainer-warning",
            type: "Warning",
            msg: "Field name already exists",
          }),
        life: 3000,
      });
      return false;
    }

    let isValidation =
      !newField?.name || !newField?.type || newField?.stages?.length === 0;
    setIsValidation(isValidation);
    return !isValidation;
  };

  return (
    <>
      <Toast ref={toast} />
      <div className={DynamicSectionWithFieldStyles.heading}>Fields</div>
      <div className={`${DynamicSectionWithFieldStyles.container} container`}>
        {(actionBooleans?.isEdit || categoryClickingID === null) && (
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
        )}
        {sections.map((section, sectionIndex) => (
          <div
            key={sectionIndex}
            className={DynamicSectionWithFieldStyles.sectionContainer}
          >
            <Label className={DynamicSectionWithFieldStyles.label}>
              Section name
            </Label>
            <InputText
              disabled={actionBooleans?.isView && categoryClickingID !== null}
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
                  {(actionBooleans?.isEdit || categoryClickingID === null) && (
                    <Column
                      header="Action"
                      body={(row, { rowIndex }) =>
                        ActionBodyTemplate(row, sectionIndex, rowIndex)
                      }
                    ></Column>
                  )}
                </DataTable>
              </div>
            ) : (
              ""
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {(actionBooleans?.isEdit || categoryClickingID === null) && (
                <Button
                  icon={
                    <IoIosAddCircle
                      className={
                        DynamicSectionWithFieldStyles.addSectionBtnIcon
                      }
                    />
                  }
                  label="Add Field"
                  onClick={() => {
                    setNewField({ ...newField, sectionIndex });
                    setShowPopup(true);
                  }}
                  className={DynamicSectionWithFieldStyles.addFieldButton}
                />
              )}
              {section.columns?.length >= 2 ? (
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
                maxLength={25}
              />
              {isValidation && !newField?.name && (
                <span className="errorMsg">Field Name is required</span>
              )}
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
              {isValidation && !newField?.type && (
                <span className="errorMsg">Field type is required</span>
              )}
            </div>
            <div className={DynamicSectionWithFieldStyles.columnNameContainer}>
              {newField.type === "Choice" && (
                <>
                  <div
                    className={DynamicSectionWithFieldStyles.choiceContainer}
                  >
                    <InputText
                      value={newChoice}
                      // onChange={(e) => setNewChoice(e.target.value)}
                      onChange={(e) => {
                        setNewChoice(e.target.value);
                        if (e.target.value.trim() !== "") setChoiceError(false);
                      }}
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
                          setChoiceError(false);
                        } else {
                          setChoiceError(true);
                        }
                      }}
                      className="customSubmitButton"
                    />
                  </div>
                  {choiceError && (
                    <span className="errorMsg">Choice cannot be empty</span>
                  )}
                </>
              )}
            </div>

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
              {approvalStage?.map((stage) => (
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
              {isValidation && newField?.stages?.length == 0 && (
                <span className="errorMsg">Field stage is required</span>
              )}
            </div>
            <div className={DynamicSectionWithFieldStyles.dialogButtons}>
              <Button
                label="Cancel"
                icon="pi pi-times"
                onClick={() => {
                  setShowPopup(false);
                  setIsValidation(false);
                  setChoiceError(false);
                  setFieldEdit(false);
                }}
                className="customCancelButton"
              />
              <Button
                label="Save"
                icon="pi pi-save"
                onClick={() => {
                  if (FieldValidateFunc()) {
                    handleSaveField();
                  }
                }}
                autoFocus
                className="customSubmitButton"
                disabled={choiceError}
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
              sessionStorage.clear();
              setSections([]); // Clear state
            }}
          />

          <Button
            icon="pi pi-angle-double-right"
            label="Next"
            onClick={() => {
              validateFunction();
            }}
            className="customSubmitButton"
          />
        </div>
      </div>
    </>
  );
};

export default DynamicSectionWithField;
