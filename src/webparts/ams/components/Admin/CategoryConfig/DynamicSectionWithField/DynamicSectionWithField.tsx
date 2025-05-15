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
import { AiOutlineAppstore } from "react-icons/ai";
import { LuPlus } from "react-icons/lu";
import { LuTrash2 } from "react-icons/lu";
//Styles Imports:
import DynamicSectionWithFieldStyles from "./DynamicSectionWithField.module.scss";
import "../../../../../../External/style.css";
import "./DynamicSectionWithField.css";
import {
  PeoplePicker,
  PrincipalType,
} from "@pnp/spfx-controls-react/lib/PeoplePicker";
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
import { Calendar } from "primereact/calendar";

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
  const [sections, setSections] = useState([]);
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
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFields, setPreviewFields] = useState<any>([]);
  const [approvalStage, setApprovalStage] = useState([]);
  const addDynamicSection = () => {
    setSections([...sections, { name: "", sectionID: null, columns: [] }]);
  };
  const [isValidation, setIsValidation] = useState<boolean>(false);
  const [choiceError, setChoiceError] = useState<boolean>(false);
  const [fieldEdit, setFieldEdit] = useState<boolean>(false);
  console.log("finalSubmit", finalSubmit);

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

  const handleDeleteSection = (index: number) => {
    const updatedSections = [...sections];
    updatedSections.splice(index, 1);
    setSections(updatedSections);
  };

  const RequiredBodyTemplate = (rowData) => {
    return <div>{rowData?.required ? "Yes" : "No"}</div>;
  };

  const ActionBodyTemplate = (rowData, sectionIndex, rowIndex) => {
    return (
      <div className={DynamicSectionWithFieldStyles.ActionIconsContainer}>
        <div className={DynamicSectionWithFieldStyles?.actionIconLayer}>
          <TbEdit
            onClick={() => handleEditField(rowData, sectionIndex, rowIndex)}
          />
        </div>
        <div className={DynamicSectionWithFieldStyles?.actionIconLayer}>
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
  //Category in draft
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

  // Get Category Sections
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

  //Update sectionConfigList
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

  // Get Category Sections
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

  //Update sectionConfigList
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

  //Update sectionColumnsConfigList
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

  //Update sectionColumnsConfigList
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

  //Add to Column in Our SharepointList
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

  const validateFunction = (isDraft) => {
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

  //Field Validation Function:
  const FieldValidateFunc = async () => {
    let isValidation =
      !newField?.name || !newField?.type || newField?.stages?.length === 0;
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
          }),
        life: 3000,
      });
      return false;
    }
    return true;
  };

  return (
    <>
      <Toast ref={toast} />
      <div className="workFlowHeaderContainer">
        <div className="workFlowHeaderIcon">
          <AiOutlineAppstore />
        </div>
        <div>Form Configuration</div>
        {categoryClickingID === null && (
          <Button
            icon={<LuPlus className="modernBtnIcon" />}
            label="Add Section"
            onClick={addDynamicSection}
            className="modernButton"
            style={{ marginLeft: "30px" }}
          />
        )}
      </div>
      {/* <div className={DynamicSectionWithFieldStyles.heading}>Fields</div> */}
      <div className={`${DynamicSectionWithFieldStyles.container} container`}>
        <div className={DynamicSectionWithFieldStyles.sectionWrapper}>
          {sections.map((section, sectionIndex) => (
            <div
              key={sectionIndex}
              className={DynamicSectionWithFieldStyles.sectionContainer}
            >
              <div className={DynamicSectionWithFieldStyles.sectionlabelHeader}>
                <Label className={DynamicSectionWithFieldStyles.label}>
                  Section name
                </Label>
                {categoryClickingID === null && sections?.length > 1 && (
                  <LuTrash2
                    className={DynamicSectionWithFieldStyles.deleteIcon}
                    onClick={() => handleDeleteSection(sectionIndex)}
                  />
                )}
              </div>
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
                <>
                  <Label className={DynamicSectionWithFieldStyles.label}>
                    Fields
                  </Label>
                  <div className="customDataTableContainer">
                    <DataTable
                      value={section.columns}
                      emptyMessage={
                        <>
                          <p style={{ textAlign: "center" }}>
                            No Records Found
                          </p>
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
                      {(actionBooleans?.isEdit ||
                        categoryClickingID === null) && (
                        <Column
                          header="Action"
                          body={(row, { rowIndex }) =>
                            ActionBodyTemplate(row, sectionIndex, rowIndex)
                          }
                        ></Column>
                      )}
                    </DataTable>
                  </div>
                </>
              ) : (
                ""
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {(actionBooleans?.isEdit || categoryClickingID === null) && (
                  <Button
                    icon={<LuPlus className="modernBtnIcon" />}
                    label="Add Field"
                    onClick={() => {
                      setNewField({ ...newField, sectionIndex });
                      setShowPopup(true);
                    }}
                    className="modernButton"
                  />
                )}
                {/* {section.columns?.length >= 2 ? (
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
                    style={{ marginLeft: "0" }}
                  />
                ) : (
                  ""
                )} */}
              </div>
            </div>
          ))}
        </div>
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
            {newField?.columnID === null && (
              <div
                className={DynamicSectionWithFieldStyles.columnNameContainer}
              >
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
                      required:
                        e.value === "YesorNo" ? false : newField?.required,
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
            )}
            <div className={DynamicSectionWithFieldStyles.columnNameContainer}>
              {newField.type === "Choice" && newField?.columnID === null && (
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

            {!(newField.type === "YesorNo") && (
              <div
                className={DynamicSectionWithFieldStyles.columnNameContainer}
              >
                <Label className={DynamicSectionWithFieldStyles.label}>
                  Require that this column contains information
                </Label>
                <InputSwitch
                  checked={newField.required}
                  onChange={(e) =>
                    setNewField({
                      ...newField,
                      required: e.value,
                    })
                  }
                  className="InputSwitch"
                />
              </div>
            )}
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
                  setActiveStep(1);
                }}
                className="customCancelButton"
              />
              <Button
                label="Save"
                icon="pi pi-save"
                onClick={async () => {
                  const isValid = await FieldValidateFunc();
                  if (isValid) {
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
                {field.type === "Number" && (
                  <InputText
                    keyfilter="num"
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
                {field.type === "Date" && (
                  <Calendar
                    dateFormat="dd/mm/yy"
                    showIcon
                    className={DynamicSectionWithFieldStyles.previewInput}
                  />
                )}
                {field.type === "DateTime" && (
                  <Calendar
                    id="calendar-12h"
                    showTime
                    hourFormat="12"
                    dateFormat="dd/mm/yy"
                    showIcon
                    className={DynamicSectionWithFieldStyles.previewInput}
                  />
                )}
                {field.type === "Person" && (
                  <PeoplePicker
                    context={context}
                    personSelectionLimit={1}
                    groupName={""}
                    showtooltip={true}
                    ensureUser={true}
                    principalTypes={[PrincipalType.User]}
                    resolveDelay={1000}
                  />
                )}
                {field.type === "PersonMulti" && (
                  <PeoplePicker
                    context={context}
                    personSelectionLimit={5}
                    groupName={""}
                    showtooltip={true}
                    ensureUser={true}
                    principalTypes={[PrincipalType.User]}
                    resolveDelay={1000}
                  />
                )}
                {field.type === "YesorNo" && (
                  <Checkbox checked={false}></Checkbox>
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
