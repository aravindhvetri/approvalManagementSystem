//Default Imports:
import * as React from "react";
import { useState, useEffect } from "react";
//PrimeReact Imports:
import { Button } from "primereact/button";
import { RadioButton } from "primereact/radiobutton";
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

const EmailContainer = ({
  setFinalSubmit,
  setNextStageFromCategory,
  setSelectedApprover,
  setCategoryInputs,
  setEmailContainerFieldSideBarVisible,
  finalSubmit,
  getCategoryConfigDetails,
}) => {
  console.log(finalSubmit, "FinalSubmit");
  const [selectedEmail, setSelectedEmail] = useState<string>("");
  const [existingEmailData, setExistingEmailData] = useState([]);
  const [customEmailData, setCustomEmailData] = useState([]);
  console.log(customEmailData, "customEmailData");

  //Get ExistingEmailTempalte Datas:
  const getExistingEmailTemlateData = (ExistingEmailData: []) => {
    setExistingEmailData([...ExistingEmailData]);
  };

  //Get CustomEmailTempalte Datas:
  const getCustomEmailTemlateData = (CustomEmailData: []) => {
    setCustomEmailData([...CustomEmailData]);
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

  //Add Datas to Sharepoint List:
  const finalHandleSubmit = async () => {
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
                  finalSubmit?.categoryConfig?.customApprover?.apprvalFlowName,
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
                      ColumnInternalName: column?.name,
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
      setNextStageFromCategory({ ...Config.NextStageFromCategorySideBar });
      setEmailContainerFieldSideBarVisible(false);
      setSelectedApprover("");
      setCategoryInputs("");
      setFinalSubmit({ ...Config.finalSubmitDetails });
      getCategoryConfigDetails();
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      alert("An error occurred while processing the request.");
    }
  };

  //Add to Column in Our SharepointList
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
      .then((res: any) => {
        console.log("addApprovalStageConfigDetails res", res);
      })
      .catch((err) => console.log("addApprovalStageConfigDetails error", err));
  };

  return (
    <>
      <div className={EmailContainerStyles.heading}>Email template</div>
      <div className={`${EmailContainerStyles.radioContainer}`}>
        <div className={`${EmailContainerStyles.radioDiv}`}>
          <RadioButton
            inputId="existing"
            name="email"
            value="existing"
            onChange={(e) => {
              setSelectedEmail(e?.value);
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
            onChange={(e) => setSelectedEmail(e?.value)}
            checked={selectedEmail === "custom"}
          />
          <label className={`${EmailContainerStyles.radioDivLabel}`}>
            Custom template
          </label>
        </div>
      </div>
      <div>
        {selectedEmail == "existing" ? (
          <ExistingEmail ExisitingEmailData={getExistingEmailTemlateData} />
        ) : selectedEmail == "custom" ? (
          <CustomEmail
            customEmailData={getCustomEmailTemlateData}
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
              finalHandleSubmit();
            }}
            className="customSubmitButton"
          />
        </div>
      </div>
    </>
  );
};

export default EmailContainer;
