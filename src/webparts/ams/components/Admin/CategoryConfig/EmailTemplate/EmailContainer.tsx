//Default Imports:
import * as React from "react";
import { useState, useEffect, useRef } from "react";
//PrimeReact Imports:
import { Button } from "primereact/button";
import { RadioButton } from "primereact/radiobutton";
import { Toast } from "primereact/toast";
//Styles Imports:
import EmailContainerStyles from "./EmailContainer.module.scss";
//Commmon Service Imports:
import {
  IApprovalStages,
  IFinalSubmitDetails,
  INextStageFromCategorySideBar,
} from "../../../../../../CommonServices/interface";
import { Config } from "../../../../../../CommonServices/Config";
import ExistingEmail from "./EmailChildTemplates/ExistingEmail";
import CustomEmail from "./EmailChildTemplates/CustomEmail";
import SPServices from "../../../../../../CommonServices/SPServices";
import { sp } from "@pnp/sp";
import Loader from "../../../Loader/Loader";
import { toastNotify } from "../../../../../../CommonServices/CommonTemplates";
import { trim } from "lodash";

const EmailContainer = ({
  actionBooleans,
  setFinalSubmit,
  getCategoryFunction,
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
    //Handle ReLoad Browser then clear session Storage:
    const handleBeforeUnload = () => {
      sessionStorage.clear();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Store selectedEmail in sessionStorage on change
  useEffect(() => {
    sessionStorage.setItem("selectedEmail", selectedEmail);
  }, [selectedEmail]);

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

  const valiadateFunc = () => {
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

        const requiredStatuses = ["Approval", "Reject", "ReSubmit", "Submit"];
        const actualStatuses = CustomEmailFlowDetails?.map((item) =>
          item?.status?.trim()?.toLowerCase()
        );

        const hasEmptyFields = CustomEmailFlowDetails?.some(
          (item) =>
            !item?.templateName?.trim() ||
            !item?.emailBody?.trim() ||
            !item?.status?.trim()
        );

        const allStatusesPresent = requiredStatuses.every((status) =>
          actualStatuses.includes(status.toLowerCase())
        );

        if (
          hasEmptyFields ||
          CustomEmailFlowDetails.length < 4 ||
          !allStatusesPresent
        ) {
          let errorMsg = "";

          if (hasEmptyFields) {
            errorMsg = "Please enter all fields";
          } else if (CustomEmailFlowDetails.length < 4) {
            errorMsg = "Minimum 4 custom templates are required";
          } else if (!allStatusesPresent) {
            errorMsg =
              "Custom email templates must include all 4 statuses: Approval, Reject, ReSubmit, and Submit";
          }

          toast.current.show({
            severity: "warn",
            summary: "Warning",
            content: (prop) =>
              toastNotify({
                iconName: "pi-exclamation-triangle",
                ClsName: "toast-imgcontainer-warning",
                type: "Warning",
                msg: errorMsg,
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
      finalHandleSubmit();
    }
  };

  //Add Datas to Sharepoint List:
  const finalHandleSubmit = async () => {
    if (categoryClickingID) {
      //Update categoryConfig Details
      try {
        const res = await SPServices.SPUpdateItem({
          Listname: Config.ListNames.CategoryConfig,
          ID: categoryClickingID,
          RequestJSON: {
            Category: finalSubmit?.categoryConfig?.category,
          },
        });
        //Get and Isdelete Category Section Details
        const columnTypeMap = {
          text: 2,
          textarea: 3,
          Choice: 6,
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
        getCategoryFunction();
        setNextStageFromCategory({ ...Config.NextStageFromCategorySideBar });
        setEmailContainerFieldSideBarVisible(false);
        setSelectedApprover("");
        setCategoryInputs("");
        setFinalSubmit({ ...Config.finalSubmitDetails });
        getCategoryConfigDetails();
        setShowLoader(false);
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

            if (finalSubmit?.categoryConfig?.customApprover !== null) {
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
                    text: 2,
                    textarea: 3,
                    Choice: 6,
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

        alert("Process completed successfully!");
        sessionStorage.clear();
        getCategoryFunction();
        setNextStageFromCategory({ ...Config.NextStageFromCategorySideBar });
        setEmailContainerFieldSideBarVisible(false);
        setSelectedApprover("");
        setCategoryInputs("");
        setFinalSubmit({ ...Config.finalSubmitDetails });
        getCategoryConfigDetails();
        setShowLoader(false);
      } catch (err) {
        console.error("Error in handleSubmit:", err);
        alert("An error occurred while processing the request.");
        setShowLoader(false);
      }
    }
  };

  //Add to Column in Our SharepointList
  const addColumnToList = async (list, fieldTypeKind, columnName, choices) => {
    try {
      if (fieldTypeKind === 2) {
        await list.fields.addText(columnName.replace(/\s/g, "")); // For Single Line Text
      } else if (fieldTypeKind === 3) {
        await list.fields.addMultilineText(columnName.replace(/\s/g, "")); // For Multiple Lines of Text
      } else if (fieldTypeKind === 6) {
        await list.fields.addChoice(columnName.replace(/\s/g, ""), choices); // Pass choices array directly
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

  return (
    <>
      <Toast ref={toast} />
      <div className={EmailContainerStyles.heading}>Email template</div>
      {!(actionBooleans?.isView || actionBooleans?.isEdit) && (
        <div className={`${EmailContainerStyles.radioContainer}`}>
          <div className={`${EmailContainerStyles.radioDiv}`}>
            <RadioButton
              inputId="existing"
              name="email"
              value="existing"
              onChange={(e) => {
                setSelectedEmail(e?.value);
                sessionStorage.removeItem("customTemplates");
              }}
              checked={selectedEmail === "existing"}
            />
            <label
              className={`${EmailContainerStyles.radioDivLabel}`}
              htmlFor="existing"
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
                sessionStorage.removeItem("selectedDropValues");
              }}
              checked={selectedEmail === "custom"}
            />
            <label className={`${EmailContainerStyles.radioDivLabel}`}>
              Custom template
            </label>
          </div>
        </div>
      )}
      {validateError &&
        !selectedEmail &&
        actionBooleans?.isView === false &&
        actionBooleans?.isEdit === false && (
          <div style={{ marginBottom: "20px" }}>
            <span className="errorMsg">
              {validateError?.emailTemplateSelected}
            </span>
          </div>
        )}
      <div>
        {selectedEmail == "existing" ? (
          <ExistingEmail ExisitingEmailData={getExistingEmailTemlateData} />
        ) : selectedEmail == "custom" || categoryClickingID !== null ? (
          <CustomEmail
            actionBooleans={actionBooleans}
            categoryClickingID={categoryClickingID}
            customEmailData={getCustomEmailTemlateData}
            customEmailDataWithEmpty={getCustomEmailDataWithEmpty}
            setCustomEmailTemplateSideBarVisible={
              setEmailContainerFieldSideBarVisible
            }
          />
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
                    valiadateFunc();
                  } else {
                    setShowLoader(true);
                    finalHandleSubmit();
                  }
                }}
                className="customSubmitButton"
              />
            </>
          )}
        </div>
      </div>
      {showLoader ? <Loader /> : ""}
    </>
  );
};

export default EmailContainer;
