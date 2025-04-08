//Default Imports:
import * as React from "react";
import { useState, useEffect } from "react";
//CommonService Imports:
import SPServices from "../../../../CommonServices/SPServices";
import { Config } from "../../../../CommonServices/Config";
import {
  IPeoplePickerDetails,
  IRightSideBarContents,
  ISectionColumnsConfig,
  IApprovalDetails,
  IBasicFilterCategoryDrop,
} from "../../../../CommonServices/interface";
import { generateRequestID } from "../../../../CommonServices/CommonTemplates";
//primeReact Imports:
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Label } from "office-ui-fabric-react";
import { classNames } from "primereact/utils";
//Styles Imports:
import dynamicFieldsStyles from "./RequestsFields.module.scss";
import "../../../../External/style.css";
import WorkflowActionButtons from "../WorkflowButtons/WorkflowActionButtons";
import { Dropdown } from "primereact/dropdown";
import Loader from "../Loader/Loader";

const AddRequestsFields = ({
  categoryFilterValue,
  context,
  setRequestsDashBoardContent,
  setDynamicRequestsSideBarVisible,
}) => {
  const [dynamicFields, setDynamicFields] = useState<ISectionColumnsConfig[]>(
    []
  );
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [selectedCategory, setSelectedCategory] =
    useState<IBasicFilterCategoryDrop>();
  const [showLoader, setShowLoader] = useState<boolean>(false);

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
            columnType: item?.ColumnType,
            isRequired: item?.IsRequired,
            viewStage: JSON.parse(item?.ViewStage),
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
      })
      .catch((er) => {
        console.log("getapprovalJson error", er);
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

  //handleInputChange
  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    dynamicFields.forEach((field) => {
      if (field.isRequired && !formData[field.columnName]?.trim()) {
        newErrors[field.columnName] = `${field.columnName} is required.`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setShowLoader(true);
      await SPServices.SPAddItem({
        Listname: Config.ListNames.RequestsHub,
        RequestJSON: formData,
      })
        .then(async (e) => {
          setShowLoader(false);
          SPServices.SPUpdateItem({
            Listname: Config.ListNames.RequestsHub,
            ID: e.data.ID,
            RequestJSON: {
              RequestID: `R-${generateRequestID(e.data.ID, 5, 0)}`,
            },
          })
            .then(() => {
              setDynamicRequestsSideBarVisible(false);
              setShowLoader(false);
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
          <div className={dynamicFieldsStyles.formContainer}>
            <div className={dynamicFieldsStyles.singlelineFields}>
              {dynamicFields
                .filter((f) => f.columnType === "Singleline")
                .map((field) => (
                  <div
                    key={field.id}
                    className={dynamicFieldsStyles.inputField}
                  >
                    <Label className={dynamicFieldsStyles.label}>
                      {field.columnName}
                      {field?.isRequired && <span className="required">*</span>}
                    </Label>
                    <InputText
                      id={field.columnName}
                      value={formData[field.columnName] || ""}
                      onChange={(e) =>
                        handleInputChange(field.columnName, e.target.value)
                      }
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
              {dynamicFields
                .filter((f) => f.columnType === "Multiline")
                .map((field) => (
                  <div
                    key={field.id}
                    className={dynamicFieldsStyles.inputField}
                  >
                    <Label className={dynamicFieldsStyles.label}>
                      {field.columnName}{" "}
                      {field?.isRequired && <span className="required">*</span>}
                    </Label>
                    <InputTextarea
                      id={field.columnName}
                      autoResize
                      value={formData[field.columnName] || ""}
                      onChange={(e) =>
                        handleInputChange(field.columnName, e.target.value)
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
          </div>
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
  }, [dynamicFields, formData, errors, selectedCategory]);

  return <>{showLoader ? <Loader /> : ""}</>;
};

export default AddRequestsFields;
