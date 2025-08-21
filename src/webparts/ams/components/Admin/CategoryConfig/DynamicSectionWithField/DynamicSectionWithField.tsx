//Default Imports:
import * as React from "react";
import { useState, useEffect, useRef } from "react";
//PrimeReact Imports:
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { TbEdit } from "react-icons/tb";
import { AiOutlineAppstore } from "react-icons/ai";
import { LuPlus } from "react-icons/lu";
import { LuTrash2 } from "react-icons/lu";
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
  IApprovalStages,
  IFinalSubmitDetails,
  INextStageFromCategorySideBar,
} from "../../../../../../CommonServices/interface";
import { sp } from "@pnp/sp";
import SPServices from "../../../../../../CommonServices/SPServices";
import { Toast } from "primereact/toast";
import { IoCheckmark } from "react-icons/io5";
import FieldForms from "./FieldForms";
import { IoIosCheckmarkCircleOutline } from "react-icons/io";

const DynamicSectionWithField = ({
  finalSubmit,
  categoryDraft,
  getCategoryConfigDetails,
  context,
  categoryClickingID,
  actionBooleans,
  previous,
  setActiveStep,
  activeStep,
  next,
  setNextStageFromCategory,
  setSelectedApprover,
  setDynamicSectionWithFieldSideBarVisible,
  setFinalSubmit,
}) => {
  const toast = useRef<Toast>(null);
  const [sections, setSections] = useState([
    {
      name: "Section 1",
      isEditing: false,
      showFieldForm: false,
      columns: [],
    },
  ]);
  const [showPopup, setShowPopup] = useState(false);
  const [newChoice, setNewChoice] = useState("");
  const [newField, setNewField] = useState<any>({
    columnID: null,
    sectionIndex: null,
    name: "",
    type: null,
    required: false,
    stages: [],
    choices: [],
  });
  const [isValidation, setIsValidation] = useState<boolean>(false);
  const [choiceError, setChoiceError] = useState<boolean>(false);
  const [fieldEdit, setFieldEdit] = useState<boolean>(false);
  const [approvalStage, setApprovalStage] = useState([]);
  const [editingFieldSectionIndex, setEditingFieldSectionIndex] = useState<
    number | null
  >(null);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(
    null
  );
  console.log(sections, "sections");
  console.log(editingFieldSectionIndex, "editingFieldSectionIndex");

  //Sections Adding Func:
  const addDynamicSection = () => {
    if (sections.length === 0) {
      setSections([
        {
          name: `Section 1`,
          isEditing: false,
          showFieldForm: false,
          columns: [],
        },
      ]);
      return;
    }
    const lastSection = sections[sections.length - 1];

    const isLastSectionFilled =
      lastSection &&
      lastSection.name.trim() !== "" &&
      lastSection.columns.length > 0;

    if (!isLastSectionFilled) {
      toast.current.show({
        severity: "warn",
        summary: "Fill Section",
        content: (prop) =>
          toastNotify({
            iconName: "pi-exclamation-triangle",
            ClsName: "toast-imgcontainer-warning",
            type: "Warning",
            msg: "Please fill the current section before adding a new one.",
            image: require("../../../../../../../src/webparts/ams/assets/warning.png"),
          }),
        life: 3000,
      });
      return;
    }
    setSections([
      ...sections,
      {
        name: `Section ${sections.length + 1}`,
        isEditing: false,
        showFieldForm: false,
        columns: [],
      },
    ]);
  };

  //Section Name Edit Func :
  const handleSectionNameEditFunc = (sectionIndex) => {
    const anyEditing = sections.some((section) => section.showFieldForm);
    if (anyEditing) {
      toast.current.show({
        severity: "warn",
        summary: "Fill Section",
        content: (prop) =>
          toastNotify({
            iconName: "pi-exclamation-triangle",
            ClsName: "toast-imgcontainer-warning",
            type: "Warning",
            msg: `${Config?.ToastCommonMessage}`,
            image: require("../../../../../../../src/webparts/ams/assets/warning.png"),
          }),
        life: 3000,
      });
      return;
    }
    const updatedSections = [...sections];
    updatedSections[sectionIndex].isEditing = true;
    setSections(updatedSections);
  };

  //Sections Deleted Func:
  const handleDeleteSection = (index: number) => {
    const anyEditing = sections.some((section) => section.showFieldForm);
    if (anyEditing) {
      toast.current.show({
        severity: "warn",
        summary: "Fill Section",
        content: (prop) =>
          toastNotify({
            iconName: "pi-exclamation-triangle",
            ClsName: "toast-imgcontainer-warning",
            type: "Warning",
            msg: `${Config?.ToastCommonMessage}`,
            image: require("../../../../../../../src/webparts/ams/assets/warning.png"),
          }),
        life: 3000,
      });
      return;
    }
    const updatedSections = [...sections];
    updatedSections.splice(index, 1);

    // Re-index Section Names after deletion
    const reIndexedSections = updatedSections.map((section, idx) => ({
      ...section,
      name: `Section ${idx + 1}`,
    }));
    setSections(reIndexedSections);
  };

  //Add forms Func:
  const handleAddFieldFunc = (sectionIndex) => {
    const anyEditing = sections.some((section) => section.showFieldForm);
    if (anyEditing) {
      toast.current.show({
        severity: "warn",
        summary: "Fill Section",
        content: (prop) =>
          toastNotify({
            iconName: "pi-exclamation-triangle",
            ClsName: "toast-imgcontainer-warning",
            type: "Warning",
            msg: `${Config?.ToastCommonMessage}`,
            image: require("../../../../../../../src/webparts/ams/assets/warning.png"),
          }),
        life: 3000,
      });
      return;
    }

    const updated = [...sections];
    updated[sectionIndex].showFieldForm = true;
    setSections(updated);

    setEditingFieldSectionIndex(null);
    setEditingFieldIndex(null);
    setNewField({
      sectionIndex,
      name: "",
      type: "",
      stages: [],
      required: false,
      choices: [],
    });
    setFieldEdit(false);
  };

  //Field Forms Save Button Func:
  const handleSaveField = () => {
    const updatedSections = [...sections];
    if (newField.sectionIndex !== null && newField.sectionIndex !== undefined) {
      if (newField.rowIndex !== undefined && newField.rowIndex !== null) {
        // Edit existing field
        updatedSections[newField.sectionIndex].columns[newField.rowIndex] = {
          ...newField,
          choices: newField.type === "Choice" ? newField.choices : [],
        };
      } else {
        // Add new field
        updatedSections[newField.sectionIndex].columns.push({
          ...newField,
          choices: newField.type === "Choice" ? newField.choices : [],
        });
      }
    }

    // Reset all forms
    const resetSections = updatedSections.map((section) => ({
      ...section,
      showFieldForm: false,
    }));

    setSections(resetSections);
    setNewField({});
    setFieldEdit(false);
    setEditingFieldSectionIndex(null);
    setEditingFieldIndex(null);
  };

  //Field Forms particular item Edited Func:
  const handleEditField = (rowData, sectionIndex, rowIndex) => {
    const anyEditing = sections.some((section) => section.showFieldForm);
    if (anyEditing) {
      toast.current.show({
        severity: "warn",
        summary: "Fill Section",
        content: (prop) =>
          toastNotify({
            iconName: "pi-exclamation-triangle",
            ClsName: "toast-imgcontainer-warning",
            type: "Warning",
            msg: `${Config?.ToastCommonMessage}`,
            image: require("../../../../../../../src/webparts/ams/assets/warning.png"),
          }),
        life: 3000,
      });
      return;
    }

    setNewField({
      ...rowData,
      sectionIndex: sectionIndex,
      rowIndex: rowIndex,
    });

    setEditingFieldSectionIndex(sectionIndex);
    setEditingFieldIndex(rowIndex);

    const updatedSections = [...sections];
    updatedSections.forEach((section, idx) => {
      section.showFieldForm = idx === sectionIndex;
    });
    setSections(updatedSections);

    setFieldEdit(true);
  };

  //Field Forms Cancel Button Func:
  const handleCancelField = () => {
    const resetSections = sections.map((section) => ({
      ...section,
      showFieldForm: false,
    }));
    setSections(resetSections);

    setActiveStep(1);
    setIsValidation(false);
    setChoiceError(false);
    setFieldEdit(false);
    setNewField({});
    setEditingFieldSectionIndex(null);
    setEditingFieldIndex(null);
  };

  //Field Forms particular item deleted Func:
  const handleDeleteField = (sectionIndex, fieldIndex) => {
    const anyEditing = sections.some((section) => section.showFieldForm);
    if (anyEditing) {
      toast.current.show({
        severity: "warn",
        summary: "Fill Section",
        content: (prop) =>
          toastNotify({
            iconName: "pi-exclamation-triangle",
            ClsName: "toast-imgcontainer-warning",
            type: "Warning",
            msg: `${Config?.ToastCommonMessage}`,
            image: require("../../../../../../../src/webparts/ams/assets/warning.png"),
          }),
        life: 3000,
      });
      return;
    }
    const updated = [...sections];
    updated[sectionIndex].columns.splice(fieldIndex, 1);
    setSections(updated);
  };

  //Category in draft:
  const draftCategory = async () => {
    if (categoryClickingID) {
      try {
        const res = await SPServices.SPUpdateItem({
          Listname: Config.ListNames.CategoryConfig,
          ID: categoryClickingID,
          RequestJSON: {
            Category: finalSubmit?.categoryConfig?.category,
            RequestIdFormat: finalSubmit?.categoryConfig?.requestIdFormat,
            RequestIdDigits: finalSubmit?.categoryConfig?.requestIdDigit,
            ViewApproverSignStages: `[{"Stage": ${JSON.stringify(
              finalSubmit?.categoryConfig?.viewApproverSignStages
                .map((item) => parseInt(item.split(" ")[1]))
                .sort((x, y) => x - y)
            )}}]`,
            IsApproverSignRequired:
              finalSubmit?.categoryConfig?.isApproverSignRequired,
            IsDraft: true,
            DraftedState: activeStep,
          },
        });
        //Get and Isdelete Category Section Details
        const columnTypeMap = {
          text: 1,
          textarea: 2,
          Choice: 3,
          Number: 4,
          Date: 5,
          DateTime: 6,
          Person: 7,
          PersonMulti: 8,
          YesorNo: 9,
        };
        const list = sp.web.lists.getByTitle("RequestsHub");
        const sectionsDetails = await getCategorySectionDetails(
          categoryClickingID
        );
        finalSubmit?.dynamicSectionWithField?.forEach(async (section: any) => {
          if (section?.sectionID) {
            if (
              sectionsDetails
                ?.map((e: any) => e?.ID)
                .includes(section?.sectionID)
            ) {
              const tempJson = {
                CategoryId: categoryClickingID,
                SectionName: section?.name,
              };

              await updateSectionConfigList(section?.sectionID, tempJson);
              const columnDetails = await getCategorySectionColumnsDetails(
                section?.sectionID
              );
              section?.columns?.forEach(async (column: any) => {
                if (column?.columnID) {
                  if (
                    columnDetails
                      ?.map((e: any) => e?.ID)
                      .includes(column?.columnID)
                  ) {
                    //update in list Pending.............
                    //
                    const tempColumnJson = {
                      ColumnExternalName: column?.name,
                      ColumnType:
                        column?.type == "text"
                          ? "Singleline"
                          : column?.type == "textarea"
                          ? "Multiline"
                          : column?.type,
                      IsRequired: column?.required,
                      ViewStage: `[{"Stage": ${JSON.stringify(
                        column?.stages
                          .map((item) => parseInt(item.split(" ")[1]))
                          .sort((x, y) => x - y)
                      )}}]`,
                      ChoiceValues:
                        column?.type == "Choice"
                          ? `[{"Options":${JSON.stringify(column?.choices)}}]`
                          : "",
                    };
                    await updatesectionColumnsConfigList(
                      column?.columnID,
                      tempColumnJson
                    );
                  }
                } else {
                  let fieldTypeKind;
                  fieldTypeKind = columnTypeMap[column.type];
                  await addColumnToList(
                    list,
                    fieldTypeKind,
                    column.name,
                    column.choices || []
                  );
                  addsectionColumnsConfigList({
                    ParentSectionId: section?.sectionID,
                    ColumnInternalName: (column?.name).replace(/\s/g, ""),
                    ColumnExternalName: column?.name,
                    ColumnType:
                      column?.type == "text"
                        ? "Singleline"
                        : column?.type == "textarea"
                        ? "Multiline"
                        : column?.type,
                    IsRequired: column?.required,
                    ViewStage: `[{"Stage": ${JSON.stringify(
                      column?.stages
                        .map((item) => parseInt(item.split(" ")[1]))
                        .sort((x, y) => x - y)
                    )}}]`,
                    ChoiceValues:
                      column?.type == "Choice"
                        ? `[{"Options":${JSON.stringify(column?.choices)}}]`
                        : "",
                  });
                }
              });
              //Deleted Columns
              const deletedColumns = columnDetails?.filter(
                (e: any) =>
                  !section?.columns.map((e: any) => e?.columnID).includes(e?.ID)
              );
              if (deletedColumns.length > 0) {
                deletedColumns?.forEach((item: any) => {
                  updatesectionColumnsConfigList(item?.ID, {
                    IsDelete: true,
                  });
                });
              }
            }
          } else {
            const tempJson = {
              CategoryId: categoryClickingID,
              SectionName: section?.name,
            };
            const newSection: any = await addSectionConfigList(tempJson);
            section?.columns?.forEach(async (column: any) => {
              let fieldTypeKind;
              fieldTypeKind = columnTypeMap[column.type];
              await addColumnToList(
                list,
                fieldTypeKind,
                column.name,
                column.choices || []
              );
              addsectionColumnsConfigList({
                ParentSectionId: newSection?.data?.ID,
                ColumnInternalName: column?.name.replace(/\s/g, ""),
                ColumnExternalName: column?.name,
                ColumnType:
                  column?.type == "text"
                    ? "Singleline"
                    : column?.type == "textarea"
                    ? "Multiline"
                    : column?.type,
                IsRequired: column?.required,
                ViewStage: `[{"Stage": ${JSON.stringify(
                  column?.stages
                    .map((item) => parseInt(item.split(" ")[1]))
                    .sort((x, y) => x - y)
                )}}]`,
                ChoiceValues:
                  column?.type == "Choice"
                    ? `[{"Options":${JSON.stringify(column?.choices)}}]`
                    : "",
              });
            });
          }
        });
        //Deleted Sections and their columns
        const deletedSections = sectionsDetails?.filter(
          (e: any) =>
            !finalSubmit?.dynamicSectionWithField
              ?.map((e: any) => e?.sectionID)
              .includes(e?.ID)
        );
        if (deletedSections.length > 0) {
          deletedSections?.forEach(async (item: any) => {
            updateSectionConfigList(item?.ID, {
              IsDelete: true,
            });
            const getDeletedSectionColumns =
              await getCategorySectionColumnsDetails(item?.ID);
            getDeletedSectionColumns?.forEach(async (item: any) => {
              updatesectionColumnsConfigList(item?.ID, {
                IsDelete: true,
              });
            });
          });
        }

        alert("Process completed successfully!");
        sessionStorage.clear();
        getCategoryConfigDetails();
        setDynamicSectionWithFieldSideBarVisible(false);
      } catch {
        (err) => console.log("Draft category details err", err);
      }
    } else {
      try {
        if (finalSubmit?.categoryConfig?.category !== "") {
          const res = await SPServices.SPAddItem({
            Listname: Config.ListNames.CategoryConfig,
            RequestJSON: {
              Category: finalSubmit?.categoryConfig?.category,
              RequestIdFormat: finalSubmit?.categoryConfig?.requestIdFormat,
              RequestIdDigits: finalSubmit?.categoryConfig?.requestIdDigit,
              ViewApproverSignStages: `[{"Stage": ${JSON.stringify(
                finalSubmit?.categoryConfig?.viewApproverSignStages
                  .map((item) => parseInt(item.split(" ")[1]))
                  .sort((x, y) => x - y)
              )}}]`,
              IsApproverSignRequired:
                finalSubmit?.categoryConfig?.isApproverSignRequired,
              IsDraft: true,
              DraftedState: activeStep,
            },
          });

          if (res?.data?.ID) {
            const newCategoryId = res?.data?.ID; // Use a variable instead of state

            if (finalSubmit?.categoryConfig?.ExistingApprover !== null) {
              const existingApprovalConfig: any = await SPServices.SPReadItems({
                Listname: Config.ListNames.ApprovalConfig,
                Select: "ID,CategoryId",
                Filter: [
                  {
                    FilterKey: "ID",
                    Operator: "eq",
                    FilterValue:
                      finalSubmit?.categoryConfig?.ExistingApprover.toString(),
                  },
                ],
              });

              let existingCategories =
                existingApprovalConfig[0]?.CategoryId || [];
              existingCategories.push(newCategoryId);

              await SPServices.SPUpdateItem({
                Listname: Config.ListNames.ApprovalConfig,
                ID: finalSubmit?.categoryConfig?.ExistingApprover,
                RequestJSON: {
                  CategoryId: { results: existingCategories },
                },
              });
            }
            if (finalSubmit?.categoryConfig?.ExistingApprover === null) {
              const customApprovalConfigRes = await SPServices.SPAddItem({
                Listname: Config.ListNames.ApprovalConfig,
                RequestJSON: {
                  CategoryId: { results: [newCategoryId] },
                  ApprovalFlowName:
                    finalSubmit?.categoryConfig?.customApprover
                      ?.apprvalFlowName,
                  TotalStages:
                    finalSubmit?.categoryConfig?.customApprover?.totalStages,
                  RejectionFlow:
                    finalSubmit?.categoryConfig?.customApprover?.rejectionFlow,
                },
              });

              await finalSubmit?.categoryConfig?.customApprover?.stages?.forEach(
                (stage) =>
                  addApprovalStageConfigDetails(
                    customApprovalConfigRes?.data.ID,
                    stage
                  )
              );
            }
            if (finalSubmit?.dynamicSectionWithField?.length > 0) {
              const list = sp.web.lists.getByTitle("RequestsHub");

              for (const section of finalSubmit.dynamicSectionWithField) {
                let categorySectionId = null;

                for (const column of section.columns) {
                  let fieldTypeKind;
                  const columnTypeMap = {
                    text: 1,
                    textarea: 2,
                    Choice: 3,
                    Number: 4,
                    Date: 5,
                    DateTime: 6,
                    Person: 7,
                    PersonMulti: 8,
                    YesorNo: 9,
                  };

                  fieldTypeKind = columnTypeMap[column.type];
                  if (!fieldTypeKind) {
                    console.log("Invalid column type:", column.type);
                    continue;
                  }

                  await addColumnToList(
                    list,
                    fieldTypeKind,
                    column.name,
                    column.choices || []
                  );

                  if (categorySectionId === null) {
                    const CategorySecionConfigRes = await SPServices.SPAddItem({
                      Listname: Config.ListNames?.CategorySectionConfig,
                      RequestJSON: {
                        CategoryId: newCategoryId,
                        SectionName: section.name,
                      },
                    });

                    if (CategorySecionConfigRes?.data?.ID) {
                      categorySectionId = CategorySecionConfigRes?.data?.ID;
                    }
                  }

                  if (categorySectionId) {
                    await SPServices.SPAddItem({
                      Listname: Config.ListNames?.SectionColumnsConfig,
                      RequestJSON: {
                        ParentSectionId: categorySectionId,
                        ColumnInternalName: column?.name.replace(/\s/g, ""),
                        ColumnExternalName: column?.name,
                        ColumnType:
                          column?.type == "text"
                            ? "Singleline"
                            : column?.type == "textarea"
                            ? "Multiline"
                            : column?.type,
                        IsRequired: column?.required,
                        ViewStage: `[{"Stage": ${JSON.stringify(
                          column?.stages
                            .map((item) => parseInt(item.split(" ")[1]))
                            .sort((x, y) => x - y)
                        )}}]`,
                        ChoiceValues:
                          column?.type == "Choice"
                            ? `[{"Options":${JSON.stringify(column?.choices)}}]`
                            : "",
                      },
                    });
                  }
                }
              }
            }
          }
        }
        alert("Process completed successfully!");
        sessionStorage.clear();
        getCategoryConfigDetails();
        setDynamicSectionWithFieldSideBarVisible(false);
      } catch {
        (err) => console.log("Draft category details err", err);
      }
    }
  };

  // Get Category Sections Details:
  const getCategorySectionDetails = async (dataID) => {
    try {
      const res = await SPServices.SPReadItems({
        Listname: Config.ListNames.CategorySectionConfig,
        Select: "*,Category/Id",
        Expand: "Category",
        Filter: [
          {
            FilterKey: "CategoryId",
            Operator: "eq",
            FilterValue: dataID?.toString(),
          },
          {
            FilterKey: "IsDelete",
            Operator: "eq",
            FilterValue: "false",
          },
        ],
      });
      return res;
    } catch {
      (err) => console.log("getCategorySectionDetails error", err);
    }
  };

  //Update sectionConfigList:
  const updateSectionConfigList = (ItemID, dataJson: {}) => {
    SPServices.SPUpdateItem({
      Listname: Config.ListNames.CategorySectionConfig,
      ID: ItemID,
      RequestJSON: dataJson,
    })
      .then((res) => {
        return res;
      })
      .catch((err) => console.log("updateSectionConfigList err", err));
  };

  // Get Category SectionColumns Details:
  const getCategorySectionColumnsDetails = async (dataID) => {
    try {
      const res = await SPServices.SPReadItems({
        Listname: Config.ListNames.SectionColumnsConfig,
        Select: "*,ParentSection/Id",
        Expand: "ParentSection",
        Filter: [
          {
            FilterKey: "ParentSectionId",
            Operator: "eq",
            FilterValue: dataID?.toString(),
          },
          {
            FilterKey: "IsDelete",
            Operator: "eq",
            FilterValue: "false",
          },
        ],
      });
      return res;
    } catch {
      (err) => console.log("getCategorySectionDetails error", err);
    }
  };

  //Update sectionConfigList:
  const addSectionConfigList = async (dataJson: {}) => {
    try {
      const res = await SPServices.SPAddItem({
        Listname: Config.ListNames.CategorySectionConfig,
        RequestJSON: dataJson,
      });
      return res;
    } catch {
      (err) => console.log("addSectionConfigList err", err);
    }
  };

  //Update sectionColumnsConfigList:
  const addsectionColumnsConfigList = async (dataJson: {}) => {
    try {
      const res = await SPServices.SPAddItem({
        Listname: Config.ListNames.SectionColumnsConfig,
        RequestJSON: dataJson,
      });
      return res;
    } catch {
      (err) => console.log("addsectionColumnsConfigList err", err);
    }
  };

  //Update sectionColumnsConfigList:
  const updatesectionColumnsConfigList = (ItemID, dataJson: {}) => {
    SPServices.SPUpdateItem({
      Listname: Config.ListNames.SectionColumnsConfig,
      ID: ItemID,
      RequestJSON: dataJson,
    })
      .then((res) => {
        return res;
      })
      .catch((err) => console.log("updatesectionColumnsConfigList err", err));
  };

  //Add to Column in Our SharepointList:
  const addColumnToList = async (list, fieldTypeKind, columnName, choices) => {
    const tempColumnName = columnName.replace(/\s/g, "");
    try {
      if (fieldTypeKind === 1) {
        await list.fields.addText(tempColumnName); // For Single Line Text
      } else if (fieldTypeKind === 2) {
        await list.fields.addMultilineText(tempColumnName); // For Multiple Lines of Text
      } else if (fieldTypeKind === 3) {
        await list.fields.addChoice(tempColumnName, choices); // Pass choices array directly
      } else if (fieldTypeKind === 4) {
        // Pass number column directly
        await list.fields.add(tempColumnName, "SP.FieldNumber", {
          Title: tempColumnName, // Display name (UI title)
          FieldTypeKind: 9, // Type: Number
          MinimumValue: 0,
        });
      } else if (fieldTypeKind === 5) {
        // Pass Date column directly
        await list.fields.add(tempColumnName, "SP.FieldDateTime", {
          Title: tempColumnName,
          FieldTypeKind: 4, // Required for date/time
          DisplayFormat: 0, // 0 = Date Only, 1 = Date + Time
          Required: false,
        });
      } else if (fieldTypeKind === 6) {
        // Pass Date column directly
        await list.fields.add(tempColumnName, "SP.FieldDateTime", {
          Title: tempColumnName,
          FieldTypeKind: 4, // Required for date/time
          DisplayFormat: 1, // 0 = Date Only, 1 = Date + Time
          Required: false,
        });
      } else if (fieldTypeKind === 7) {
        // Pass Person column directly
        await list.fields.add(tempColumnName, "SP.FieldUser", {
          Title: tempColumnName,
          FieldTypeKind: 20, // Required for Person or Group field
          Required: false,
          AllowMultipleValues: false, // true = allow multiple people
          Presence: true, // show presence indicator
          SelectionMode: 0, // 0 = People Only, 1 = People & Groups
        });
      } else if (fieldTypeKind === 8) {
        // Pass Person column directly
        await list.fields.add(tempColumnName, "SP.FieldUser", {
          Title: tempColumnName,
          FieldTypeKind: 20, // Required for Person or Group field
          Required: false,
          AllowMultipleValues: true, // true = allow multiple people
          Presence: true, // show presence indicator
          SelectionMode: 0, // 0 = People Only, 1 = People & Groups
        });
      } else if (fieldTypeKind === 9) {
        // Pass Yes or No column directly
        await list.fields.createFieldAsXml(`
          <Field 
            DisplayName="${tempColumnName}"
            Name="${tempColumnName}"
            Type="Boolean"
            Required="FALSE"
          >
            <Default>0</Default> 
          </Field>
        `);
      }
    } catch (error) {
      console.error(`Error adding column ${columnName}:`, error);
    }
  };

  //ApprovalStageConfig Details Patch:
  const addApprovalStageConfigDetails = (
    parentId: number,
    stage: IApprovalStages
  ) => {
    const tempApprovers = stage?.approver?.map((e) => e.id);
    SPServices.SPAddItem({
      Listname: Config.ListNames.ApprovalStageConfig,
      RequestJSON: {
        ParentApprovalId: parentId,
        Stage: stage?.stage,
        ApprovalProcess: stage?.approvalProcess,
        ApproverId: { results: tempApprovers },
      },
    })
      .then((res: any) => {})
      .catch((err) => console.log("addApprovalStageConfigDetails error", err));
  };

  //Get Category SectionConfig Details:
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

  // Get Sections Columns Config:
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

  //Get Approval Stage Count:
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

  const validateFunction = (isDraft) => {
    let isValid = true;
    const anyEditing = sections.some((section) => section.showFieldForm);
    if (anyEditing) {
      toast.current.show({
        severity: "warn",
        summary: "Fill Section",
        content: (prop) =>
          toastNotify({
            iconName: "pi-exclamation-triangle",
            ClsName: "toast-imgcontainer-warning",
            type: "Warning",
            msg: `${Config?.ToastCommonMessage}`,
            image: require("../../../../../../../src/webparts/ams/assets/warning.png"),
          }),
        life: 3000,
      });
      return;
    }
    if (sections?.length == 0) {
      isValid = false;
      toast.current.show({
        severity: "warn",
        summary: "Fill Section",
        content: (prop) =>
          toastNotify({
            iconName: "pi-exclamation-triangle",
            ClsName: "toast-imgcontainer-warning",
            type: "Warning",
            msg: "Atleast one section is required",
            image: require("../../../../../../../src/webparts/ams/assets/warning.png"),
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
              msg: "Please enter a current section name",
              image: require("../../../../../../../src/webparts/ams/assets/warning.png"),
            }),
          life: 3000,
        });
      } else if (section.columns?.length == 0) {
        isValid = false;
        toast.current.show({
          severity: "warn",
          summary: "Fill Section",
          content: (prop) =>
            toastNotify({
              iconName: "pi-exclamation-triangle",
              ClsName: "toast-imgcontainer-warning",
              type: "Warning",
              msg: "Each section must have at least one required field.",
              image: require("../../../../../../../src/webparts/ams/assets/warning.png"),
            }),
          life: 3000,
        });
      }
    });

    if (isValid) {
      if (isDraft) {
        draftCategory();
      } else {
        setNextStageFromCategory((prev: INextStageFromCategorySideBar) => ({
          ...prev,
          EmailTemplateSection: true,
          dynamicSectionWithField: false,
        }));
        next();
      }
    }
    return isValid;
  };

  //Dynamic choice added function:
  const handleChoiceAdded = () => {
    const trimmedChoice = newChoice.trim();
    const isDuplicate = newField.choices.some(
      (choice) => choice.toLowerCase() === trimmedChoice.toLowerCase()
    );

    if (trimmedChoice === "") {
      setChoiceError(true);
    } else if (isDuplicate) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        content: (prop) =>
          toastNotify({
            iconName: "pi-exclamation-triangle",
            ClsName: "toast-imgcontainer-warning",
            type: "Warning",
            msg: `${trimmedChoice} already exists`,
            image: require("../../../../../../../src/webparts/ams/assets/warning.png"),
          }),
        life: 3000,
      });
    } else {
      setNewField({
        ...newField,
        choices: [...newField.choices, trimmedChoice],
      });
      setNewChoice("");
      setChoiceError(false);
    }
  };

  //Field Validation Function:
  const FieldValidateFunc = async () => {
    console.log(newField, "newField");
    let isValidation =
      !newField?.name || !newField?.type || newField?.stages.length == 0;
    setIsValidation(isValidation);
    if (isValidation) return false;

    const res: any = await SPServices.SPReadItems({
      Listname: Config.ListNames?.SectionColumnsConfig,
      Select: "*",
    });

    const tempGetcolumnInternalName =
      res?.map((item: any) => ({
        columnInternalName: item?.ColumnInternalName?.toLowerCase(),
      })) || [];

    const existingFieldNames = [
      ...sections?.flatMap((section) =>
        (section?.columns || []).map((field) => field?.name?.toLowerCase())
      ),
      ...tempGetcolumnInternalName.map((col) => col.columnInternalName),
    ];

    const isDuplicateName = existingFieldNames.includes(
      newField?.name?.toLowerCase()
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
            image: require("../../../../../../../src/webparts/ams/assets/warning.png"),
          }),
        life: 3000,
      });
      return false;
    }
    return true;
  };

  useEffect(() => {
    getApprovalStageCount();
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

  return (
    <>
      <Toast ref={toast} />
      <div className="workFlowHeaderContainer">
        <div className="workFlowHeaderIcon">
          <AiOutlineAppstore />
        </div>
        <div style={{ fontFamily: "interSemiBold" }}>Form configuration</div>
        {categoryClickingID === null &&
          sections[sections.length - 1]?.columns.length > 0 && (
            <Button
              icon={<LuPlus className="modernBtnIcon" />}
              label="Add section"
              onClick={addDynamicSection}
              className="modernButton"
              style={{ marginLeft: "30px", padding: "6px 14px 6px 14px" }}
            />
          )}
      </div>
      <div
        style={
          categoryClickingID === null &&
          sections[sections.length - 1]?.columns.length > 0
            ? { height: "465px" }
            : { height: "476px" }
        }
        className={`${DynamicSectionWithFieldStyles.container} container`}
      >
        <div className={DynamicSectionWithFieldStyles.sectionWrapper}>
          {sections.map((section, sectionIndex) => (
            <div
              key={sectionIndex}
              className={DynamicSectionWithFieldStyles.sectionContainer}
            >
              {/* Section Name Input */}
              <div className={DynamicSectionWithFieldStyles.sectionlabelHeader}>
                <div
                  style={
                    section?.isEditing
                      ? { padding: 0 }
                      : { padding: "1px 15px" }
                  }
                  className={
                    DynamicSectionWithFieldStyles.sectionInputContainer
                  }
                >
                  {section.isEditing ? (
                    <div
                      style={{ padding: "6px", backgroundColor: "transparent" }}
                      className={
                        DynamicSectionWithFieldStyles.sectionInputContainer
                      }
                    >
                      <InputText
                        value={section.name}
                        placeholder="Enter your section name"
                        onChange={(e) => {
                          const updatedSections = [...sections];
                          updatedSections[sectionIndex].name = e.target.value;
                          setSections(updatedSections);
                        }}
                        className={`inputField${DynamicSectionWithFieldStyles.sectionInput}`}
                      />
                      <div className="actionIconLayer">
                        <IoIosCheckmarkCircleOutline
                          onClick={() => {
                            const updatedSections = [...sections];
                            updatedSections[sectionIndex].isEditing = false;
                            setSections(updatedSections);
                          }}
                          style={{
                            cursor: "pointer",
                            fontSize: "20px",
                            color: "#0286c9",
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Label className={DynamicSectionWithFieldStyles.label}>
                        {section?.name}
                      </Label>
                      {(actionBooleans?.isEdit ||
                        categoryClickingID === null) && (
                        <div className="actionIconLayer">
                          <TbEdit
                            onClick={() => {
                              handleSectionNameEditFunc(sectionIndex);
                            }}
                            style={{ cursor: "pointer", color: "#272634" }}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div>
                  {(actionBooleans?.isEdit || categoryClickingID === null) &&
                    sections?.length > 1 && (
                      <Button
                        icon={<LuTrash2 style={{ color: "red" }} />}
                        label="Remove section"
                        onClick={() => {
                          handleDeleteSection(sectionIndex);
                        }}
                        className="modernButton"
                        style={{
                          padding: "6px 15px 6px 15px",
                          gap: "10px",
                        }}
                      />
                    )}
                </div>
              </div>

              {/* Fields List */}
              {section.columns?.length > 0 && (
                <>
                  <Label className={DynamicSectionWithFieldStyles.label}>
                    Fields
                  </Label>
                  <div>
                    {section.columns.map((field, fieldIndex) => (
                      <div key={fieldIndex}>
                        {editingFieldSectionIndex === sectionIndex &&
                        editingFieldIndex === fieldIndex ? (
                          section.showFieldForm && (
                            <FieldForms
                              newField={newField}
                              setNewField={setNewField}
                              columnTypes={columnTypes}
                              approvalStage={approvalStage}
                              isValidation={isValidation}
                              newChoice={newChoice}
                              setNewChoice={setNewChoice}
                              choiceError={choiceError}
                              setChoiceError={setChoiceError}
                              handleChoiceAdded={handleChoiceAdded}
                              handleCancelField={handleCancelField}
                              FieldValidateFunc={FieldValidateFunc}
                              handleSaveField={handleSaveField}
                              DynamicSectionWithFieldStyles={
                                DynamicSectionWithFieldStyles
                              }
                            />
                          )
                        ) : (
                          <div
                            className={DynamicSectionWithFieldStyles.fieldItem}
                          >
                            <div
                              className={
                                DynamicSectionWithFieldStyles.fieldDetail
                              }
                            >
                              <Label
                                className={
                                  DynamicSectionWithFieldStyles.DetailName
                                }
                              >
                                Name
                              </Label>
                              <div
                                className={
                                  DynamicSectionWithFieldStyles.fieldValue
                                }
                              >
                                {field.name}
                              </div>
                            </div>
                            <div
                              className={
                                DynamicSectionWithFieldStyles.fieldDetail
                              }
                            >
                              <Label
                                className={
                                  DynamicSectionWithFieldStyles.DetailName
                                }
                              >
                                Type
                              </Label>
                              <div
                                className={
                                  DynamicSectionWithFieldStyles.fieldValue
                                }
                              >
                                {field.type}
                              </div>
                            </div>
                            <div
                              className={
                                DynamicSectionWithFieldStyles.fieldDetail
                              }
                            >
                              <Label
                                className={
                                  DynamicSectionWithFieldStyles.DetailName
                                }
                              >
                                Required
                              </Label>
                              <div
                                className={
                                  DynamicSectionWithFieldStyles.fieldValue
                                }
                              >
                                {field.required ? "Yes" : "No"}
                              </div>
                            </div>
                            <div
                              className={
                                DynamicSectionWithFieldStyles.fieldDetail
                              }
                            >
                              <Label
                                className={
                                  DynamicSectionWithFieldStyles.DetailName
                                }
                              >
                                Approver
                              </Label>
                              <div
                                className={
                                  DynamicSectionWithFieldStyles.fieldValue
                                }
                              >
                                {field.stages?.map((stage, idx) => (
                                  <span
                                    key={idx}
                                    className={
                                      DynamicSectionWithFieldStyles.stageTag
                                    }
                                  >
                                    {stage}
                                  </span>
                                ))}
                              </div>
                            </div>
                            {(actionBooleans?.isEdit ||
                              categoryClickingID === null) && (
                              <div
                                className={
                                  DynamicSectionWithFieldStyles.fieldActions
                                }
                              >
                                <div className="actionIconLayer">
                                  <TbEdit
                                    style={{ color: "#272634" }}
                                    onClick={() => {
                                      handleEditField(
                                        field,
                                        sectionIndex,
                                        fieldIndex
                                      );
                                    }}
                                  />
                                </div>
                                <div className="actionIconLayer">
                                  <LuTrash2
                                    style={{ color: "red" }}
                                    onClick={() => {
                                      handleDeleteField(
                                        sectionIndex,
                                        fieldIndex
                                      );
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {editingFieldSectionIndex === null && section.showFieldForm && (
                <FieldForms
                  newField={newField}
                  setNewField={setNewField}
                  columnTypes={columnTypes}
                  approvalStage={approvalStage}
                  isValidation={isValidation}
                  newChoice={newChoice}
                  setNewChoice={setNewChoice}
                  choiceError={choiceError}
                  setChoiceError={setChoiceError}
                  handleChoiceAdded={handleChoiceAdded}
                  handleCancelField={handleCancelField}
                  FieldValidateFunc={FieldValidateFunc}
                  handleSaveField={handleSaveField}
                  DynamicSectionWithFieldStyles={DynamicSectionWithFieldStyles}
                />
              )}

              {/* Add Field Button */}
              {(actionBooleans?.isEdit || categoryClickingID === null) && (
                <Button
                  icon={<LuPlus />}
                  label="Add field"
                  onClick={() => {
                    handleAddFieldFunc(sectionIndex);
                  }}
                  className="modernButton"
                  style={{
                    width: "17%",
                    padding: "6px 15px 6px 15px",
                  }}
                />
              )}
            </div>
          ))}
        </div>
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
              previous();
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
              validateFunction(false);
            }}
            className="customSubmitButton"
          />
        </div>
      </div>
    </>
  );
};

export default DynamicSectionWithField;
