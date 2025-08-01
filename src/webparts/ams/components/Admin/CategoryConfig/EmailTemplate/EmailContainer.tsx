//Default Imports:
import * as React from "react";
import { useState, useEffect, useRef } from "react";
//PrimeReact Imports:
import { Button } from "primereact/button";
import { RadioButton } from "primereact/radiobutton";
import { Toast } from "primereact/toast";
import { MdOutlineEmail } from "react-icons/md";
//Styles Imports:
import EmailContainerStyles from "./EmailContainer.module.scss";
//Commmon Service Imports:
import {
  IApprovalStages,
  IFinalSubmitDetails,
  INextStageFromCategorySideBar,
  ITabviewDetails,
} from "../../../../../../CommonServices/interface";
import { Config } from "../../../../../../CommonServices/Config";
import ExistingEmail from "./EmailChildTemplates/ExistingEmail";
import CustomEmail from "./EmailChildTemplates/CustomEmail";
import SPServices from "../../../../../../CommonServices/SPServices";
import { sp } from "@pnp/sp";
import Loader from "../../../Loader/Loader";
import {
  tabViewBar,
  toastNotify,
} from "../../../../../../CommonServices/CommonTemplates";
import { trim } from "lodash";
import { Dialog } from "primereact/dialog";

const EmailContainer = ({
  actionBooleans,
  setFinalSubmit,
  categoryDraft,
  setActiveStep,
  activeStep,
  previous,
  categoryClickingID,
  setNextStageFromCategory,
  setSelectedApprover,
  setCategoryInputs,
  setEmailContainerFieldSideBarVisible,
  finalSubmit,
  getCategoryConfigDetails,
}) => {
  const toast = useRef<Toast>(null);
  const [selectedEmail, setSelectedEmail] = useState<string>("");
  const [existingEmailData, setExistingEmailData] = useState([]);
  const [customEmailData, setCustomEmailData] = useState([]);
  const [customEmailDataWithEmpty, setCustomEmailDataWithEmpty] = useState([]);
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [validateError, setValidateError] = useState({
    emailTemplateSelected: "",
  });
  const [activeEmailTab, setActiveEmailTab] = useState(0);
  const [delModal, setDelModal] = useState(false);

  //Get ExistingEmailTempalte Datas:
  const getExistingEmailTemlateData = (ExistingEmailData: []) => {
    setExistingEmailData([...ExistingEmailData]);
  };

  //Get CustomEmailTempalte Datas:
  const getCustomEmailTemlateData = (CustomEmailData: []) => {
    setCustomEmailData([...CustomEmailData]);
  };
  //Get CustomEmailDataWithEmpty:
  const getCustomEmailDataWithEmpty = (CustomEmailDataWithEmpty: []) => {
    if (actionBooleans?.isView == false && actionBooleans?.isEdit == false) {
      setCustomEmailDataWithEmpty([...CustomEmailDataWithEmpty]);
    }
  };

  // Load sessionStorage data on mount
  useEffect(() => {
    const storedEmail = sessionStorage.getItem("selectedEmail");
    if (storedEmail) {
      setSelectedEmail(storedEmail);
    }
  }, []);

  // Store selectedEmail in sessionStorage on change
  useEffect(() => {
    sessionStorage.setItem("selectedEmail", selectedEmail);
  }, [selectedEmail]);

  //Get email template config list
  const getEmailTemplateDetails = async () => {
    try {
      const res = await SPServices.SPReadItems({
        Listname: Config.ListNames.EmailTemplateConfig,
        Select: "*",
      });
      return res;
    } catch {
      (err) => console.log("getEmailTemplateDetails", getEmailTemplateDetails);
      return [];
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

  const valiadateFunc = async (isDraft: boolean) => {
    let isValid = true;
    if (selectedEmail === "") {
      validateError.emailTemplateSelected =
        "Email flow is mandatory for Email process";
      isValid = false;
    } else {
      if (selectedEmail === "existing") {
        const selectedFlow = sessionStorage.getItem("selectedDropValues");
        if (!selectedFlow) {
          toast.current.show({
            severity: "warn",
            summary: "Warning",
            content: (prop) =>
              toastNotify({
                iconName: "pi-exclamation-triangle",
                ClsName: "toast-imgcontainer-warning",
                type: "Warning",
                msg: "Please select an existing email flow",
                image: require("../../../../../../../src/webparts/ams/assets/giphy.gif"),
              }),
            life: 3000,
          });
          isValid = false;
        } else {
          try {
            const flowArr = JSON.parse(selectedFlow);
            const hasEmptyValue = flowArr.some(
              (item) => item.process && item.value.trim() === ""
            );
            if (hasEmptyValue) {
              toast.current.show({
                severity: "warn",
                summary: "Warning",
                content: (prop) =>
                  toastNotify({
                    iconName: "pi-exclamation-triangle",
                    ClsName: "toast-imgcontainer-warning",
                    type: "Warning",
                    msg: "One or more email templates are missing in the flow",
                    image: require("../../../../../../../src/webparts/ams/assets/giphy.gif"),
                  }),
                life: 3000,
              });
              isValid = false;
            } else {
              validateError.emailTemplateSelected = "";
            }
          } catch (err) {
            console.error("Invalid JSON in sessionStorage", err);
            isValid = false;
          }
        }
      }

      if (selectedEmail === "custom") {
        const CustomEmailFlowDetails = customEmailDataWithEmpty;
        var templateNameAlreadyExist = [];
        // const requiredStatuses = ["Approval", "Reject", "ReSubmit", "Submit"];
        // const actualStatuses = CustomEmailFlowDetails?.map((item) =>
        //   item?.status?.trim()?.toLowerCase()
        // );
        const emptyEmailStatus = CustomEmailFlowDetails?.filter(
          (e) =>
            e?.templateName?.trim() === "" ||
            e?.emailBody?.replace(/<p><br><\/p>/gi, "")?.trim() === ""
        );
        const duplicateTemplateNameCounts = {};
        CustomEmailFlowDetails.forEach(
          ({ templateName }) =>
            (duplicateTemplateNameCounts[templateName.trim()] =
              (duplicateTemplateNameCounts[templateName.trim()] || 0) + 1)
        );
        const sameTemplateNameExist = CustomEmailFlowDetails.filter(
          (e) => duplicateTemplateNameCounts[e?.templateName.trim()] > 1
        );
        if (!(actionBooleans?.isView || actionBooleans?.isEdit)) {
          const tempArr = await getEmailTemplateDetails();
          templateNameAlreadyExist = CustomEmailFlowDetails.filter((e) =>
            tempArr
              ?.map((e) => e?.TemplateName?.trim())
              .includes(e.templateName?.trim())
          );
        }
        // const hasEmptyFields = CustomEmailFlowDetails?.some(
        //   (item) =>
        //     !item?.templateName?.trim() ||
        //     !item?.emailBody?.trim() ||
        //     !item?.status?.trim()
        // );

        // const allStatusesPresent = requiredStatuses.every((status) =>
        //   actualStatuses.includes(status.toLowerCase())
        // );

        if (
          emptyEmailStatus.length > 0 ||
          CustomEmailFlowDetails.length < 4 ||
          sameTemplateNameExist.length > 0 ||
          templateNameAlreadyExist.length > 0
        ) {
          let errorMsg = "";

          if (emptyEmailStatus.length > 0) {
            errorMsg = `Please complete the required fields for ${emptyEmailStatus
              ?.map((e) => e?.status)
              .join(" ,")} content`;
          } else if (sameTemplateNameExist.length > 0) {
            errorMsg = `${sameTemplateNameExist
              ?.map((e) => e?.status)
              ?.join(" ,")} contents have same template name`;
          } else if (templateNameAlreadyExist.length > 0) {
            errorMsg = `${templateNameAlreadyExist
              .map((e) => e?.status)
              .join(" ,")} content template ${
              templateNameAlreadyExist.length > 1 ? "names are" : " name is"
            } already exists!`;
          } else if (CustomEmailFlowDetails.length < 4) {
            errorMsg = "Minimum 4 custom templates are required";
          }
          // else if (!allStatusesPresent) {
          //   errorMsg =
          //     "Custom email templates must include all 4 statuses: Approval, Reject, ReSubmit, and Submit";
          // }

          toast.current.show({
            severity: "warn",
            summary: "Warning",
            content: (prop) =>
              toastNotify({
                iconName: "pi-exclamation-triangle",
                ClsName: "toast-imgcontainer-warning",
                type: "Warning",
                msg: errorMsg,
                image: require("../../../../../../../src/webparts/ams/assets/giphy.gif"),
              }),
            life: 3000,
          });
          isValid = false;
        } else {
          validateError.emailTemplateSelected = "";
        }
      }
    }
    setValidateError({ ...validateError });

    if (isValid) {
      setShowLoader(true);
      finalHandleSubmit(isDraft);
    }
  };

  //Add Datas to Sharepoint List:
  const finalHandleSubmit = async (isDraft: boolean) => {
    if (categoryClickingID) {
      //Update categoryConfig Details
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
            IsDraft: isDraft,
            DraftedState: isDraft ? activeStep : null,
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
        // alert("Process completed successfully!");
        setDelModal(true);
      } catch {
        (err) => console.log("Update categoryConfig Details error", err);
        setShowLoader(false);
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
              IsDraft: isDraft,
              DraftedState: isDraft ? activeStep : null,
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

            if (existingEmailData.length > 0) {
              for (const ExistingEmailTemplatedata of existingEmailData) {
                await SPServices.SPAddItem({
                  Listname: Config.ListNames?.CategoryEmailConfig,
                  RequestJSON: {
                    CategoryId: newCategoryId,
                    Process: ExistingEmailTemplatedata?.process,
                    ParentTemplateId: ExistingEmailTemplatedata?.id,
                  },
                });
              }
            }

            if (customEmailData.length > 0) {
              for (const customEmailTemplateData of customEmailData) {
                const EmailTemplateConfigRes = await SPServices.SPAddItem({
                  Listname: Config.ListNames?.EmailTemplateConfig,
                  RequestJSON: {
                    TemplateName: customEmailTemplateData?.templateName,
                    EmailBody: customEmailTemplateData?.emailBody,
                  },
                });

                if (EmailTemplateConfigRes?.data?.ID) {
                  await SPServices.SPAddItem({
                    Listname: Config.ListNames?.CategoryEmailConfig,
                    RequestJSON: {
                      CategoryId: newCategoryId,
                      Process: customEmailTemplateData?.status,
                      ParentTemplateId: EmailTemplateConfigRes?.data?.ID,
                    },
                  });
                }
              }
            }
          }
        }

        // alert("Process completed successfully!");
        // sessionStorage.clear();
        // setNextStageFromCategory({ ...Config.NextStageFromCategorySideBar });
        // setEmailContainerFieldSideBarVisible(false);
        // setSelectedApprover("");
        // setCategoryInputs("");
        // setFinalSubmit({ ...Config.finalSubmitDetails });
        // getCategoryConfigDetails();
        // setShowLoader(false);
        // setActiveStep(0);
        setDelModal(true);
      } catch (err) {
        console.error("Error in handleSubmit:", err);
        alert("An error occurred while processing the request.");
        setShowLoader(false);
      }
    }
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

  //Custom Email tab view bar
  const emailTabViewBar = () => {
    const TempApproveConfigTabContent: ITabviewDetails[] = [
      {
        id: 1,
        name: "Approval Content",
      },
      {
        id: 2,
        name: "Rejection Content",
      },
      {
        id: 3,
        name: "Resubmission Content",
      },
      {
        id: 4,
        name: "Submission Content",
      },
    ];
    const tempApproveConfigTabView = tabViewBar(
      TempApproveConfigTabContent,
      activeEmailTab,
      setActiveEmailTab
    );
    return <>{tempApproveConfigTabView}</>;
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

  return (
    <>
      <Toast ref={toast} />
      <div className="workFlowHeaderContainer">
        <div className="workFlowHeaderIcon">
          <MdOutlineEmail />
        </div>
        <div style={{ fontFamily: "interSemiBold" }}>Email Notifications</div>
      </div>
      <div style={{ letterSpacing: "0" }}>
        {!(actionBooleans?.isView || actionBooleans?.isEdit) && (
          <div className={`${EmailContainerStyles.radioContainer}`}>
            <div className={`${EmailContainerStyles.radioDiv}`}>
              <RadioButton
                inputId="existing"
                name="email"
                value="existing"
                onChange={(e) => {
                  setSelectedEmail(e?.value);
                  setExistingEmailData([]);
                  setCustomEmailData([]);
                  sessionStorage.removeItem("customTemplates");
                }}
                checked={selectedEmail === "existing"}
              />
              <label
                style={{ cursor: "pointer" }}
                className="radioDivLabel"
                htmlFor="existing"
                onClick={() => {
                  setSelectedEmail("existing");
                  setExistingEmailData([]);
                  setCustomEmailData([]);
                  sessionStorage.removeItem("customTemplates");
                }}
              >
                Existing template
              </label>
            </div>
            <div className={`${EmailContainerStyles.radioDiv}`}>
              <RadioButton
                inputId="custom"
                name="email"
                value="custom"
                onChange={(e) => {
                  setSelectedEmail(e?.value);
                  setExistingEmailData([]);
                  setCustomEmailData([]);
                  sessionStorage.removeItem("selectedDropValues");
                  sessionStorage.removeItem("selectedEmailBody");
                }}
                checked={selectedEmail === "custom"}
              />
              <label
                style={{ cursor: "pointer" }}
                className="radioDivLabel"
                onClick={() => {
                  setSelectedEmail("custom");
                  setExistingEmailData([]);
                  setCustomEmailData([]);
                  sessionStorage.removeItem("selectedDropValues");
                  sessionStorage.removeItem("selectedEmailBody");
                }}
              >
                Custom template
              </label>
            </div>
          </div>
        )}
        {validateError &&
          !selectedEmail &&
          actionBooleans?.isView === false &&
          actionBooleans?.isEdit === false && (
            <div style={{ height: "0px", marginLeft: "40px" }}>
              <span className="errorMsg">
                {validateError?.emailTemplateSelected}
              </span>
            </div>
          )}
      </div>
      {(selectedEmail == "custom" || categoryClickingID !== null) && (
        <div
          className={`emailTabViewContainer ${EmailContainerStyles.tabViewContainer}`}
        >
          {emailTabViewBar()}
        </div>
      )}
      <div
        className={EmailContainerStyles.EmailContainer}
        style={
          selectedEmail == "existing"
            ? { height: "434px" }
            : selectedEmail == "custom" && categoryClickingID == null
            ? { height: "384px" }
            : actionBooleans?.isView || actionBooleans?.isEdit
            ? {
                height: "418px",
              }
            : {}
        }
      >
        {selectedEmail == "existing" ? (
          <ExistingEmail ExisitingEmailData={getExistingEmailTemlateData} />
        ) : selectedEmail == "custom" || categoryClickingID !== null ? (
          <>
            <CustomEmail
              actionBooleans={actionBooleans}
              categoryClickingID={categoryClickingID}
              activeEmailTab={activeEmailTab}
              customEmailData={getCustomEmailTemlateData}
              customEmailDataWithEmpty={getCustomEmailDataWithEmpty}
              setCustomEmailTemplateSideBarVisible={
                setEmailContainerFieldSideBarVisible
              }
            />
          </>
        ) : (
          ""
        )}
      </div>
      <div className={EmailContainerStyles.FlowButtonsContainer}>
        <div className={EmailContainerStyles.FlowPreviousButton}>
          <Button
            icon="pi pi-angle-double-left"
            label="Previous"
            className="customSubmitButton"
            onClick={() => {
              setNextStageFromCategory(
                (prev: INextStageFromCategorySideBar) => ({
                  ...prev,
                  EmailTemplateSection: false,
                  dynamicSectionWithField: true,
                })
              );
              previous();
            }}
          />
        </div>
        <div className={`${EmailContainerStyles.FlowSideBarButtons}`}>
          {actionBooleans?.isView && (
            <Button
              icon="pi pi-times"
              label="Close"
              className="customCancelButton"
              onClick={() => {
                setEmailContainerFieldSideBarVisible(false);
                setSelectedApprover("");
                setNextStageFromCategory({
                  ...Config.NextStageFromCategorySideBar,
                });
                sessionStorage.clear();
                setActiveStep(0);
              }}
            />
          )}
          {(actionBooleans?.isEdit || categoryClickingID === null) && (
            <>
              {" "}
              <Button
                icon="pi pi-times"
                label="Cancel"
                className="customCancelButton"
                onClick={() => {
                  setEmailContainerFieldSideBarVisible(false);
                  setSelectedApprover("");
                  setNextStageFromCategory({
                    ...Config.NextStageFromCategorySideBar,
                  });
                  sessionStorage.clear();
                  setActiveStep(0);
                }}
              />
              <Button
                icon="pi pi-save"
                label="Submit"
                onClick={() => {
                  if (
                    actionBooleans?.isView === false &&
                    actionBooleans?.isEdit === false
                  ) {
                    valiadateFunc(false);
                  } else {
                    setShowLoader(true);
                    finalHandleSubmit(false);
                  }
                }}
                className="customSubmitButton"
              />
            </>
          )}
        </div>
      </div>
      {showLoader ? <Loader /> : ""}
      <Dialog
        className="modal-template confirmation"
        draggable={false}
        blockScroll={false}
        resizable={false}
        visible={delModal}
        style={{ width: "20rem" }}
        onHide={() => {
          setDelModal(false);
        }}
      >
        <div className="modal-container">
          <div className={EmailContainerStyles.modalHeader}>
            <img
              src={require("../../../../../../../src/webparts/ams/assets/successGif.gif")}
              alt="NoImage"
              width="180px"
              height="180px"
            ></img>
          </div>
          <div className="modal-content">
            <div>
              <div className="modal-header">
                <h4>Success</h4>
              </div>
              <p>Your process has been successfully submitted</p>
            </div>
          </div>
          <div className="modal-btn-section">
            <Button
              label="OK"
              className={`submit-btn`}
              onClick={() => {
                sessionStorage.clear();
                setNextStageFromCategory({
                  ...Config.NextStageFromCategorySideBar,
                });
                setEmailContainerFieldSideBarVisible(false);
                setSelectedApprover("");
                setCategoryInputs("");
                setFinalSubmit({ ...Config.finalSubmitDetails });
                getCategoryConfigDetails();
                setShowLoader(false);
                setActiveStep(0);
                setDelModal(false);
              }}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default EmailContainer;
