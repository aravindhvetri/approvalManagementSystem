//Default Imports:
import * as React from "react";
import { useState, useEffect, useRef } from "react";
import {
  PeoplePicker,
  PrincipalType,
} from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
//CommonService Imports:
import SPServices from "../../../../CommonServices/SPServices";
import { Config } from "../../../../CommonServices/Config";
import {
  IRightSideBarContents,
  ISectionColumnsConfig,
  IBasicFilterCategoryDrop,
  IemailMessage,
  IRequestIdFormatWithDigit,
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
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import Loader from "../Loader/Loader";
import { sp } from "@pnp/sp/presets/all";
import moment from "moment";
//Styles Imports:
import dynamicFieldsStyles from "./RequestsFields.module.scss";
import "../../../../External/style.css";
import attachmentStyles from "../AttachmentUploader/AttachmentUploader.module.scss";
import "../../../../External/style.css";

const AddRequestsFields = ({
  categoryFilterValue,
  context,
  setRequestsDashBoardContent,
  setDynamicRequestsSideBarVisible,
}) => {
  const toast = useRef(null);
  const serverRelativeUrl = context?._pageContext?._site?.serverRelativeUrl;
  const [files, setFiles] = useState([]);
  console.log(files, "RequestorsFiles");
  const [dynamicFields, setDynamicFields] = useState<ISectionColumnsConfig[]>(
    []
  );
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState({});
  const [selectedCategory, setSelectedCategory] =
    useState<IBasicFilterCategoryDrop>();
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [requestIdFormat, setRequestIdFormat] =
    useState<IRequestIdFormatWithDigit>({
      ...Config.requestIdFormatWithDigit,
    });
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
        setRequestIdFormat({
          ...requestIdFormat,
          format: res?.RequestIdFormat,
          digit: res?.RequestIdDigits,
        });
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
      if (
        field.isRequired &&
        ((!formData[field.columnName]?.toString().trim() &&
          !(
            field?.columnType === "Person" ||
            field?.columnType === "PersonMulti"
          )) ||
          (!formData[`${field.columnName}Id`]?.toString().trim() &&
            field?.columnType === "Person") ||
          (!formData[`${field.columnName}Id`]?.results &&
            field?.columnType === "PersonMulti"))
      ) {
        if (
          field?.columnType === "Person" ||
          field?.columnType === "PersonMulti"
        ) {
          newErrors[
            `${field.columnName}Id`
          ] = `${field.columnDisplayName} is required.`;
        } else {
          newErrors[
            field.columnName
          ] = `${field.columnDisplayName} is required.`;
        }
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

  //Submission of form:
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

            const selectedCategoryId = formData?.CategoryId;
            const digitLength = parseInt(requestIdFormat?.digit || "3", 10);

            let count = 0;
            try {
              const categoryCountRes = await SPServices.SPReadItems({
                Listname: Config.ListNames.RequestsHub,
                Filter: [
                  {
                    FilterKey: "CategoryId",
                    Operator: "eq",
                    FilterValue: selectedCategoryId.toString(),
                  },
                ],
                FilterCondition: "and",
                Select: "RequestID",
              });
              const filteredItems = categoryCountRes?.filter(
                (item: any) =>
                  item?.RequestID !== null && item?.RequestID !== ""
              );
              count = filteredItems.length;
            } catch (err) {
              console.error("Error fetching category count:", err);
              count = 0;
            }

            const nextNumber = getFormattedNumber(count, digitLength);
            const generatedRequestId = `${requestIdFormat?.format}-${nextNumber}`;

            await SPServices.SPUpdateItem({
              Listname: Config.ListNames.RequestsHub,
              ID: e.data.ID,
              RequestJSON: {
                RequestID: generatedRequestId,
              },
            });

            await SPServices.SPReadItems({
              Listname: Config.ListNames.CategoryEmailConfig,
              Select: "*,Category/Id,ParentTemplate/Id",
              Expand: "Category,ParentTemplate",
              Filter: [
                {
                  FilterKey: "CategoryId",
                  Operator: "eq",
                  FilterValue: selectedCategoryId.toString(),
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
          } catch (error) {
            console.error("Error during file upload or update:", error);
            setShowLoader(false);
          }
        })
        .catch((err) => {
          console.log("Add item in requesthub error", err);
          setShowLoader(false);
        });
    }
  };

  //Final RequestId format:
  const getFormattedNumber = (count: number, digitLength: number): string => {
    const next = count + 1;
    return next.toString().length >= digitLength
      ? next.toString()
      : next.toString().padStart(digitLength, "0");
  };

  //Group dynamic fields by section name:
  const groupedFields = dynamicFields.reduce((acc, field) => {
    if (!acc[field.sectionName]) {
      acc[field.sectionName] = [];
    }
    acc[field.sectionName].push(field);
    return acc;
  }, {});

  //Handle File Selection:
  const handleFileSelection = async (e, files, setFiles, toast, Config) => {
    try {
      // Fetch existing files from SharePoint
      const existingSPFiles = await sp.web.lists
        .getByTitle(Config.LibraryNames?.AttachmentsLibrary)
        .items.select("FileLeafRef")
        .filter(`IsDelete eq false`)
        .get();

      const spFileNames = existingSPFiles.map((file) => file.FileLeafRef);

      const duplicatesInSP = e.files.filter((newFile) =>
        spFileNames.includes(newFile.name)
      );

      const duplicatesInState = e.files.filter((newFile) =>
        files.some((existing) => existing.name === newFile.name)
      );

      const totalDuplicates = [...duplicatesInSP, ...duplicatesInState];

      const newFiles = e.files.filter(
        (newFile) =>
          !spFileNames.includes(newFile.name) &&
          !files.some((existing) => existing.name === newFile.name)
      );

      if (totalDuplicates.length > 0) {
        toast.current?.show({
          severity: "warn",
          summary: "Warning",
          detail: "Some file names already exist!",
          life: 3000,
        });
      }

      if (newFiles.length > 0) {
        setFiles([...files, ...newFiles]);
      }
    } catch (error) {
      console.error("Error in file selection:", error);
    }
  };

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
                      .filter((f) => f.columnType === "Number")
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
                            keyfilter="num"
                            id={field.columnName}
                            value={formData[field.columnName] || null}
                            onChange={(e) =>
                              handleInputChange(
                                field.columnName,
                                Number(e.target.value)
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
                      .filter(
                        (f) =>
                          f.columnType === "PersonMulti" ||
                          f.columnType === "Person"
                      )
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
                          <PeoplePicker
                            context={context}
                            personSelectionLimit={
                              field?.columnType === "Person" ? 1 : 5
                            }
                            defaultSelectedUsers={
                              field?.columnType === "Person"
                                ? [formData[`${field.columnName}Id`]]
                                : formData[`${field.columnName}Id`]?.results
                            }
                            onChange={(e: any) => {
                              handleInputChange(
                                `${field.columnName}Id`,
                                field?.columnType === "Person"
                                  ? Number(e[0]?.id) || null
                                  : {
                                      results:
                                        e?.map((person) => person?.id) || [],
                                    }
                              );
                            }}
                            groupName={""}
                            showtooltip={true}
                            ensureUser={true}
                            principalTypes={[PrincipalType.User]}
                            resolveDelay={1000}
                          />
                          {errors[`${field.columnName}Id`] && (
                            <span className={dynamicFieldsStyles.errorMsg}>
                              {errors[`${field.columnName}Id`]}
                            </span>
                          )}
                        </div>
                      ))}
                    {fields
                      .filter(
                        (f) =>
                          f.columnType === "Date" || f.columnType === "DateTime"
                      )
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
                          <Calendar
                            id="calendar-12h"
                            value={
                              formData[field.columnName]
                                ? new Date(formData[field.columnName])
                                : null
                            }
                            onChange={(e) => {
                              handleInputChange(
                                field.columnName,
                                field?.columnType === "DateTime"
                                  ? e?.value.toLocaleString()
                                  : e?.value.toLocaleDateString("en-US")
                              );
                            }}
                            showTime={field?.columnType === "DateTime"}
                            hourFormat="12"
                            dateFormat="dd/mm/yy"
                            showIcon
                          />
                          {errors[field.columnName] && (
                            <span className={dynamicFieldsStyles.errorMsg}>
                              {errors[field.columnName]}
                            </span>
                          )}
                        </div>
                      ))}
                    {fields
                      .filter((f) => f.columnType === "YesorNo")
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
                          <Checkbox
                            onChange={(e) =>
                              handleInputChange(field.columnName, e.checked)
                            }
                            checked={formData[field.columnName]}
                            style={{
                              height: "30px",
                              width: "32px",
                            }}
                          ></Checkbox>
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
                    onSelect={(e) =>
                      handleFileSelection(e, files, setFiles, toast, Config)
                    }
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

  return (
    <>
      <Toast ref={toast} />
      {showLoader ? <Loader /> : ""}
    </>
  );
};

export default AddRequestsFields;
