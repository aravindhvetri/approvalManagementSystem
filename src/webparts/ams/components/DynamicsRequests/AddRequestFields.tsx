//Default Imports:
import * as React from "react";
import { useState, useEffect } from "react";
//CommonService Imports:
import SPServices from "../../../../CommonServices/SPServices";
import { Config } from "../../../../CommonServices/Config";
import {
  IRightSideBarContents,
  ISectionColumnsConfig,
  IBasicFilterCategoryDrop,
  IemailMessage,
} from "../../../../CommonServices/interface";
import {
  generateRequestID,
  sendNotification,
} from "../../../../CommonServices/CommonTemplates";
//primeReact Imports:
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Label } from "office-ui-fabric-react";
import { FileUpload } from "primereact/fileupload";
import { Tag } from "primereact/tag";
import { GiCancel } from "react-icons/gi";
//Styles Imports:
import dynamicFieldsStyles from "./RequestsFields.module.scss";
import "../../../../External/style.css";
import WorkflowActionButtons from "../WorkflowButtons/WorkflowActionButtons";
import { Dropdown } from "primereact/dropdown";
import Loader from "../Loader/Loader";
import { sp } from "@pnp/sp/presets/all";
import moment from "moment";
import attachmentStyles from "../AttachmentUploader/AttachmentUploader.module.scss";
import "../../../../External/style.css";

const AddRequestsFields = ({
  categoryFilterValue,
  context,
  setRequestsDashBoardContent,
  setDynamicRequestsSideBarVisible,
}) => {
  const serverRelativeUrl = context?._pageContext?._site?.serverRelativeUrl;
  const [files, setFiles] = useState([]);
  const [dynamicFields, setDynamicFields] = useState<ISectionColumnsConfig[]>(
    []
  );
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [selectedCategory, setSelectedCategory] =
    useState<IBasicFilterCategoryDrop>();
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [requestIdFormat, setRequestIdFormat] = useState<string>("");
  //CategorySectionConfig List
  const getCategorySectionConfigDetails = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames?.CategorySectionConfig,
      Select: "*,Category/Id",
      Expand: "Category",
      Orderby: "Modified",
      Orderbydecorasc: false,
      Filter: [
        {
          FilterKey: "CategoryId",
          Operator: "eq",
          FilterValue: selectedCategory?.id.toString(),
        },
        {
          FilterKey: "IsDelete",
          Operator: "eq",
          FilterValue: "false",
        },
      ],
    })
      .then((res: any) => {
        res.forEach(async (item: any) => {
          await getSectionColumnsConfigDetails(item?.SectionName, item?.ID);
        });
      })
      .catch((err) => {
        console.log(err, "getCategorySectionConfigDetails");
      });
  };
  //SectionColumnsConfig List
  const getSectionColumnsConfigDetails = (
    secionName: string,
    secionID: number
  ) => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.SectionColumnsConfig,
      Select: "*,ParentSection/Id",
      Expand: "ParentSection",
      Orderby: "Modified",
      Orderbydecorasc: false,
      Filter: [
        {
          FilterKey: "ParentSection",
          Operator: "eq",
          FilterValue: secionID.toString(),
        },
        {
          FilterKey: "IsDelete",
          Operator: "eq",
          FilterValue: "false",
        },
      ],
    })
      .then((res) => {
        const tempArr: ISectionColumnsConfig[] = [];
        res.forEach((item: any) => {
          tempArr.push({
            id: item?.ID,
            sectionName: secionName,
            columnName: item?.ColumnInternalName,
            columnDisplayName: item?.ColumnExternalName,
            columnType: item?.ColumnType,
            isRequired: item?.IsRequired,
            viewStage: JSON.parse(item?.ViewStage),
            choices:
              (JSON.parse(item?.ChoiceValues) &&
                JSON.parse(item?.ChoiceValues)[0].Options) ||
              [],
          });
        });
        setDynamicFields((prevFields) => [...prevFields, ...tempArr]);
      })
      .catch((e) => {
        console.log(e, "getSectionColumnsConfig");
      });
  };
  //Approval Json Config  //Update CategoryID and Approval Json here
  const getapprovalJson = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.ApprovalConfig,
      Select: "*,Category/Id,Category/Category",
      Expand: "Category",
      Filter: [
        {
          FilterKey: "CategoryId",
          Operator: "eq",
          FilterValue: selectedCategory?.id.toString(),
        },
      ],
    })
      .then(async (res: any) => {
        const approvalJson: any = {
          ApprovalFlowName: res[0]?.ApprovalFlowName,
          Currentstage: 1,
          TotalStages: res[0]?.TotalStages,
          RejectionFlow:
            res[0]?.RejectionFlow === "Restart from first stage"
              ? 0
              : res[0]?.RejectionFlow === "Restart from rejected stage"
              ? 1
              : 2,
          stages: await getApprovalStageConfig(res[0]?.ID),
        };
        setFormData({
          ...formData,
          ["ApprovalJson"]: `[${JSON.stringify(approvalJson)}]`,
          ["CategoryId"]: selectedCategory?.id,
        });
        getCategoryConfigDetails(selectedCategory?.id);
      })
      .catch((er) => {
        console.log("getapprovalJson error", er);
      });
  };

  //Get Category Config Details:
  const getCategoryConfigDetails = (categoryID: number) => {
    SPServices.SPReadItemUsingID({
      Listname: Config.ListNames?.CategoryConfig,
      SelectedId: categoryID,
    })
      .then((res: any) => {
        setRequestIdFormat(res?.RequestIdFormat ? res?.RequestIdFormat : "R");
      })
      .catch((err) => {
        console.log(err, "getCategoryConfigDetails error");
      });
  };

  //Approval Stage config
  const getApprovalStageConfig = async (parentID) => {
    try {
      const res = await SPServices.SPReadItems({
        Listname: Config.ListNames.ApprovalStageConfig,
        Select:
          "*,ParentApproval/Id,ParentApproval,Approver/Title,Approver/EMail,Approver/Id",
        Expand: "ParentApproval,Approver",
        Filter: [
          {
            FilterKey: "ParentApprovalId",
            Operator: "eq",
            FilterValue: parentID.toString(),
          },
        ],
      });
      return res.flatMap((Stage: any) => ({
        stage: Stage?.Stage,
        ApprovalType: Stage?.ApprovalProcess,
        approvers: Stage.Approver.map((e) => ({
          id: e.Id,
          name: e.Title,
          email: e.EMail,
          statusCode: 0,
        })),
        stageStatusCode: 0,
      }));
    } catch (err) {
      console.log("getApprovalStageConfig error", err);
      return [];
    }
  };

  //Get email content
  const getEmailContent = async (itemData, emailSubject, emailBody) => {
    const tempApprovalJson = JSON.parse(itemData?.ApprovalJson);

    const tempApprovers: string[] =
      tempApprovalJson[0]?.stages
        ?.find((stage) => stage?.stage === tempApprovalJson[0]?.Currentstage)
        ?.approvers?.map((element: any) => element) || [];
    console.log("tempApprovers", tempApprovers);

    const authorDetails = await sp.web.siteUsers
      .getById(itemData?.AuthorId)
      .get();
    const replaceDynamicContentArr = {
      "[$RequestID]": `R-${generateRequestID(itemData.ID, 5, 0)}`,
      "[$Requestor]": authorDetails?.Title,
      "[$RequestDate]": moment(itemData?.Created).format("DD-MM-YYYY"),
    };
    tempApprovers.forEach((approver: any) => {
      let finalBody = "";
      replaceDynamicContentArr["[$ToPerson]"] = approver?.name;
      Object.keys(replaceDynamicContentArr).forEach((key) => {
        finalBody = emailBody.replace(/\[\$\w+\]/g, (matched) => {
          return replaceDynamicContentArr[matched] || matched;
        });
      });
      const tempMsgContent: IemailMessage = {
        To: [`${approver?.email}`],
        Subject: emailSubject,
        Body: finalBody,
      };
      sendNotification(tempMsgContent);
    });
  };

  //handleInputChange
  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  //Validate form
  const validateForm = () => {
    const newErrors = {};
    dynamicFields.forEach((field) => {
      if (field.isRequired && !formData[field.columnName]?.trim()) {
        newErrors[field.columnName] = `${field.columnDisplayName} is required.`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  //Remove file :
  const removeFile = (fileName: string) => {
    const updatedFiles = files.filter((file) => file.name !== fileName);
    setFiles(updatedFiles);
  };

  //Submission
  const handleSubmit = async () => {
    if (validateForm()) {
      setShowLoader(true);
      await SPServices.SPAddItem({
        Listname: Config.ListNames.RequestsHub,
        RequestJSON: formData,
      })
        .then(async (e) => {
          try {
            const folderPath = `${serverRelativeUrl}/${Config.LibraryNames?.AttachmentsLibrary}/Requestors`;
            const requestId = `${e?.data?.ID}`;

            for (const file of files) {
              const fileBuffer = await file.arrayBuffer();
              const uploadResult = await sp.web
                .getFolderByServerRelativeUrl(folderPath)
                .files.add(file.name, fileBuffer, true);

              await uploadResult.file.listItemAllFields
                .get()
                .then(async (item) => {
                  await sp.web.lists
                    .getByTitle(Config.LibraryNames?.AttachmentsLibrary)
                    .items.getById(item.Id)
                    .update({
                      RequestID: requestId,
                    });
                });
            }
            setFiles([]);
            setShowLoader(false);
            console.log("All files uploaded successfully!");
          } catch (error) {
            console.error("Error uploading files:", error);
            setShowLoader(false);
          }

          SPServices.SPUpdateItem({
            Listname: Config.ListNames.RequestsHub,
            ID: e.data.ID,
            RequestJSON: {
              RequestID: `${requestIdFormat}-${generateRequestID(
                e.data.ID,
                5,
                0
              )}`,
            },
          })
            .then(async () => {
              await SPServices.SPReadItems({
                Listname: Config.ListNames.CategoryEmailConfig,
                Select: "*,Category/Id,ParentTemplate/Id",
                Expand: "Category,ParentTemplate",
                Filter: [
                  {
                    FilterKey: "CategoryId",
                    Operator: "eq",
                    FilterValue: e?.data?.CategoryId.toString(),
                  },
                  {
                    FilterKey: "Process",
                    Operator: "eq",
                    FilterValue: "Submit",
                  },
                ],
                FilterCondition: "and",
              })
                .then((res: any) => {
                  res?.forEach((element: any) => {
                    SPServices.SPReadItemUsingID({
                      Listname: Config.ListNames.EmailTemplateConfig,
                      SelectedId: element?.ParentTemplateId,
                      Select: "*",
                    })
                      .then(async (template: any) => {
                        await getEmailContent(
                          e?.data,
                          template?.TemplateName,
                          template?.EmailBody
                        );
                        setDynamicRequestsSideBarVisible(false);
                        setShowLoader(false);
                      })
                      .catch((err) =>
                        console.log("get EmailTemplateConfig error", err)
                      );
                  });
                })
                .catch((err) =>
                  console.log("get CategoryEmailConfig error", err)
                );
            })
            .catch((err) => {
              console.log("update item in requesthub error", err);
              setShowLoader(false);
            });
        })
        .catch((err) => {
          console.log("Add item in requesthub error", err);
          setShowLoader(false);
        });
    }
  };

  //Group dynamic fields by section name:
  const groupedFields = dynamicFields.reduce((acc, field) => {
    if (!acc[field.sectionName]) {
      acc[field.sectionName] = [];
    }
    acc[field.sectionName].push(field);
    return acc;
  }, {});

  //DynamicRequestFieldsSideBarContent Return Function:
  const DynamicRequestsFieldsSideBarContent = () => {
    return (
      <>
        <div className={dynamicFieldsStyles.filterHeader}>
          <Label className={dynamicFieldsStyles.label}>Category</Label>
          <Dropdown
            style={{ width: "185px" }}
            value={selectedCategory}
            options={categoryFilterValue.categoryDrop}
            onChange={(e) => {
              setSelectedCategory(e.value);
            }}
            filter
            optionLabel="name"
            placeholder="Category"
            className="w-full md:w-14rem"
          />
        </div>
        {dynamicFields.length > 0 && (
          <>
            {Object.entries(groupedFields).map(
              ([sectionName, fields]: [string, ISectionColumnsConfig[]]) => (
                <div
                  key={sectionName}
                  className={dynamicFieldsStyles.formContainer}
                >
                  <h3 className="overAllHeading">{sectionName}</h3>
                  <div className={dynamicFieldsStyles.singlelineFields}>
                    {fields
                      .filter((f) => f.columnType === "Singleline")
                      .map((field) => (
                        <div
                          key={field.id}
                          className={dynamicFieldsStyles.inputField}
                        >
                          <Label className={dynamicFieldsStyles.label}>
                            {field.columnDisplayName}
                            {field?.isRequired && (
                              <span className="required">*</span>
                            )}
                          </Label>
                          <InputText
                            id={field.columnName}
                            value={formData[field.columnName] || ""}
                            onChange={(e) =>
                              handleInputChange(
                                field.columnName,
                                e.target.value
                              )
                            }
                          />
                          {errors[field.columnName] && (
                            <span className={dynamicFieldsStyles.errorMsg}>
                              {errors[field.columnName]}
                            </span>
                          )}
                        </div>
                      ))}

                    {fields
                      .filter((f) => f.columnType === "Choice")
                      .map((field) => (
                        <div
                          key={field.id}
                          className={dynamicFieldsStyles.inputField}
                        >
                          <Label className={dynamicFieldsStyles.label}>
                            {field.columnDisplayName}
                            {field?.isRequired && (
                              <span className="required">*</span>
                            )}
                          </Label>
                          <Dropdown
                            value={field?.choices.find(
                              (e) => e === formData[field.columnName]
                            )}
                            showClear
                            options={field?.choices}
                            onChange={(e) => {
                              handleInputChange(field.columnName, e.value);
                            }}
                            filter
                            placeholder={field.columnName}
                            className="w-full md:w-14rem"
                          />
                          {errors[field.columnName] && (
                            <span className={dynamicFieldsStyles.errorMsg}>
                              {errors[field.columnName]}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>

                  <div className={dynamicFieldsStyles.multilineFields}>
                    {fields
                      .filter((f) => f.columnType === "Multiline")
                      .map((field) => (
                        <div
                          key={field.id}
                          className={dynamicFieldsStyles.inputField}
                        >
                          <Label className={dynamicFieldsStyles.label}>
                            {field.columnDisplayName}
                            {field?.isRequired && (
                              <span className="required">*</span>
                            )}
                          </Label>
                          <InputTextarea
                            id={field.columnName}
                            autoResize
                            value={formData[field.columnName] || ""}
                            onChange={(e) =>
                              handleInputChange(
                                field.columnName,
                                e.target.value
                              )
                            }
                            rows={3}
                          />
                          {errors[field.columnName] && (
                            <span className={dynamicFieldsStyles.errorMsg}>
                              {errors[field.columnName]}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )
            )}

            <div>
              <Label className={dynamicFieldsStyles.label}>Attachments</Label>
              <>
                <div>
                  <FileUpload
                    className="addNewButton"
                    name="demo[]"
                    mode="basic"
                    onSelect={(e) => setFiles([...files, ...e.files])}
                    url="/api/upload"
                    auto
                    multiple
                    maxFileSize={1000000}
                    style={{ width: "14%" }}
                    chooseLabel="Browse"
                    chooseOptions={{ icon: "" }}
                  />
                </div>
                <div style={{ marginTop: "20px" }}>
                  {files.length > 0 && (
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {files.map((file, index) => (
                        <li className={attachmentStyles?.fileList} key={index}>
                          <Tag
                            className={attachmentStyles.filNameTag}
                            value={file.name}
                          />
                          <GiCancel
                            style={{ cursor: "pointer", color: "red" }}
                            onClick={() => removeFile(file.name)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            </div>

            <div className={`${dynamicFieldsStyles.sideBarButtonContainer}`}>
              <>
                <Button
                  icon="pi pi-times"
                  label="Cancel"
                  className="customCancelButton"
                  onClick={() => handleCancel()}
                />
                <Button
                  icon="pi pi-save"
                  label="Submit"
                  className="customSubmitButton"
                  onClick={() => {
                    handleSubmit();
                  }}
                />
              </>
            </div>
          </>
        )}
      </>
    );
  };

  const handleCancel = () => {
    setDynamicRequestsSideBarVisible(false);
    setErrors({});
    setFormData({});
  };

  useEffect(() => {
    setDynamicFields([]);
    setFormData({});
    setErrors({});
    getCategorySectionConfigDetails();
    if (selectedCategory) {
      getapprovalJson();
    }
  }, [null, selectedCategory]);

  useEffect(() => {
    setRequestsDashBoardContent((prev: IRightSideBarContents) => ({
      ...prev,
      AddRequestsDashBoardContent: DynamicRequestsFieldsSideBarContent(),
    }));
  }, [dynamicFields, formData, errors, selectedCategory, files]);

  return <>{showLoader ? <Loader /> : ""}</>;
};

export default AddRequestsFields;
