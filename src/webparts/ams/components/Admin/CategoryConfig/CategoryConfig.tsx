//Default Imports:
import * as React from "react";
import { useState, useEffect, useRef } from "react";
//Common Service Imports:
import SPServices from "../../../../../CommonServices/SPServices";
import { Config } from "../../../../../CommonServices/Config";
import {
  IActionBooleans,
  ICategoryDetails,
  IRightSideBarContents,
} from "../../../../../CommonServices/interface";
//React Icons:
import { FaRegTrashAlt } from "react-icons/fa";
//Styles Imports:
import "../../../../../External/style.css";
import categoryConfigStyles from "./CategoryConfig.module.scss";
//primeReact Imports:
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { Menu } from "primereact/menu";
import { toastNotify } from "../../../../../CommonServices/CommonTemplates";

const CategoryConfig = ({
  setCategorySideBarContent,
  setCategorySideBarVisible,
}) => {
  const menuLeft = useRef(null);
  const toast = useRef<Toast>(null);
  const [categoryDetails, setCategoryDetails] = useState<ICategoryDetails[]>(
    []
  );
  const [categoryInputs, setCategoryInputs] = useState<string[]>([""]);
  const [categoryIndex, setCategoryIndex] = useState<number>(null);
  const [actionsBooleans, setActionsBooleans] = useState<IActionBooleans>({
    ...Config.InitialActionsBooleans,
  });

  const getCategoryConfigDetails = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.CategoryConfig,
      Orderby: "Modified",
      Orderbydecorasc: false,
      Select: "*",
      Filter: [
        {
          FilterKey: "IsDelete",
          Operator: "eq",
          FilterValue: "false",
        },
      ],
    })
      .then((res: any) => {
        const tempCategoryArray: ICategoryDetails[] = [];
        res.forEach((items: any) => {
          tempCategoryArray.push({
            id: items?.ID,
            category: items?.Category,
            isDelete: items?.IsDelete,
          });
        });
        setCategoryDetails([...tempCategoryArray]);
      })
      .catch((err) => {
        console.log("Get Category Config Error", err);
      });
  };

  //Set Actions PopUp:
  const actionsWithIcons = [
    {
      label: "View",
      icon: "pi pi-eye",
      className: "customView",
      command: (event: any) => {
        handleViewCategory(
          categoryDetails.find((item: any) => item.id === categoryIndex)
        );
      },
    },
    {
      label: "Edit",
      icon: "pi pi-file-edit",
      className: "customEdit",
      command: (event: any) => {
        handleEditCategory(
          categoryDetails.find((item: any) => item.id === categoryIndex)
        );
      },
    },
    {
      label: "Delete",
      icon: "pi pi-trash",
      className: "customDelete",
      command: (event: any) => {
        hanldeDeleteCategory();
      },
    },
  ];

  const handleViewCategory = (rowData: ICategoryDetails) => {
    setActionsBooleans((prev) => ({
      ...prev,
      isView: true,
    }));
    setCategoryInputs([rowData.category]);
    setCategoryIndex(rowData.id);
    setCategorySideBarVisible(true);
  };

  const handleEditCategory = (rowData: ICategoryDetails) => {
    setActionsBooleans((prev) => ({
      ...prev,
      isEdit: true,
    }));
    setCategoryInputs([rowData.category]);
    setCategoryIndex(rowData.id);
    setCategorySideBarVisible(true);
  };

  const hanldeDeleteCategory = () => {
    const currObj = {
      IsDelete: true,
    };
    SPServices.SPUpdateItem({
      Listname: Config.ListNames.CategoryConfig,
      ID: categoryIndex,
      RequestJSON: currObj,
    })
      .then((res) => {
        getCategoryConfigDetails();
      })
      .catch((err) => {
        console.log("Delete Category Error", err);
      });
  };

  const renderActionColumn = (rowData: ICategoryDetails) => {
    return (
      <div className="customActionMenu">
        <Menu
          model={actionsWithIcons}
          popup
          ref={menuLeft}
          id="popup_menu_left"
          style={{ width: "8.5rem" }}
        />
        <Button
          icon="pi pi-ellipsis-v"
          className="mr-2"
          onClick={(event) => {
            menuLeft.current.toggle(event);
            setCategoryIndex(rowData?.id);
          }}
          aria-controls="popup_menu_left"
          aria-haspopup
        />
      </div>
    );
  };

  const handleCategoryChange = (index: number, value: string) => {
    const updatedInputs = [...categoryInputs];
    updatedInputs[index] = value;
    setCategoryInputs(updatedInputs);
  };

  const addCategoryInput = () => {
    let DataEmptyCheck = categoryInputs[categoryInputs.length - 1];
    if (DataEmptyCheck) {
      setCategoryInputs([...categoryInputs, ""]);
    } else {
      toast.current?.show({
        severity: "warn",
        summary: "Warning",
        content: (prop) =>
          toastNotify({
            iconName: "pi-exclamation-triangle",
            ClsName: "toast-imgcontainer-warning",
            type: "Warning",
            msg: "Please fill the current category before adding a new one",
          }),
      });
    }
  };

  const removeCategoryInput = (index: number) => {
    const updatedInputs = categoryInputs.filter((_, i) => i !== index);
    setCategoryInputs(updatedInputs);
  };

  const submitCategories = () => {
    const validCategories = categoryInputs.filter(
      (category) => category !== ""
    );
    if (validCategories.length > 0) {
      if (actionsBooleans?.isEdit) {
        // Update the existing category
        SPServices.SPUpdateItem({
          Listname: Config.ListNames.CategoryConfig,
          ID: categoryIndex,
          RequestJSON: { Category: validCategories[0] },
        })
          .then(() => {
            toast.current?.show({
              severity: "success",
              summary: "Success",
              // detail: Config.NextContent,
              content: (prop) =>
                toastNotify({
                  iconName: "pi-check-square",
                  ClsName: "toast-imgcontainer-success",
                  type: "Success",
                  msg: "Category Updated Successfully",
                }),
            });
            getCategoryConfigDetails();
            setCategorySideBarVisible(false);
            setCategoryInputs([""]);
            setCategoryIndex(null);
            setActionsBooleans((prev) => ({
              ...prev,
              isEdit: false,
            }));
          })
          .catch((err) => console.log("Update Category Error", err));
      } else {
        // Add a new category
        const jsonArray = validCategories.map((item: string) => ({
          Category: item,
        }));
        jsonArray.forEach((json) => {
          SPServices.SPAddItem({
            Listname: Config.ListNames.CategoryConfig,
            RequestJSON: json,
          }).then(() => {
            toast.current?.show({
              severity: "success",
              summary: "Success",
              content: (prop) =>
                toastNotify({
                  iconName: "pi-check-square",
                  ClsName: "toast-imgcontainer-success",
                  type: "Success",
                  msg: "Category Added Successfully",
                }),
            });
            getCategoryConfigDetails();
            setCategorySideBarVisible(false);
            setCategoryInputs([""]);
          });
        });
      }
    }
  };

  //CategoryRightSideBar Contents:
  const categoryConfigSideBarContents = () => {
    return (
      <>
        <h4 className={categoryConfigStyles.categorySideBarHeading}>
          {actionsBooleans?.isEdit
            ? "Edit category"
            : actionsBooleans?.isView
            ? "View category"
            : "Add new category"}
        </h4>
        <div className={categoryConfigStyles.categoryContainer}>
          {categoryInputs.map((input, index) => (
            <div key={index} className={categoryConfigStyles.inputWrapper}>
              <InputText
                disabled={actionsBooleans?.isView}
                value={input}
                onChange={(e) => {
                  handleCategoryChange(index, e.target.value);
                }}
                placeholder="Enter category"
              />

              {index !== categoryInputs.length - 1 && (
                <FaRegTrashAlt onClick={() => removeCategoryInput(index)} />
              )}
            </div>
          ))}
          <div
            className={`${categoryConfigStyles.buttonWrapper} customButtonWrapper`}
          >
            <Button
              style={{ padding: "5px" }}
              icon="pi pi-plus"
              disabled={actionsBooleans?.isEdit || actionsBooleans?.isView}
              className="p-button-success"
              onClick={() => addCategoryInput()}
            />
          </div>
        </div>

        <div className={`${categoryConfigStyles.sideBarButtonContainer}`}>
          <Button
            icon="pi pi-times"
            label="Cancel"
            className="customCancelButton"
            onClick={() => {
              setCategorySideBarVisible(false);
              setCategoryInputs([""]);
              setActionsBooleans({
                isEdit: false,
                isView: false,
              });
            }}
          />
          {!actionsBooleans?.isView && (
            <Button
              icon="pi pi-save"
              label="Submit"
              className="customSubmitButton"
              onClick={() => {
                submitCategories();
              }}
            />
          )}
        </div>
      </>
    );
  };

  useEffect(() => {
    getCategoryConfigDetails();
  }, []);

  useEffect(() => {
    setCategorySideBarContent((prev: IRightSideBarContents) => ({
      ...prev,
      categoryConfigContent: categoryConfigSideBarContents(),
    }));
  }, [categoryInputs]);

  return (
    <>
      <Toast ref={toast} />
      <div className="customDataTableContainer">
        <DataTable
          value={categoryDetails}
          tableStyle={{ minWidth: "50rem" }}
          emptyMessage={
            <>
              <p style={{ textAlign: "center" }}>No Records Found</p>
            </>
          }
        >
          <Column
            style={{ width: "80%" }}
            field="category"
            header="Category"
          ></Column>
          <Column
            style={{ width: "20%" }}
            field="Action"
            body={renderActionColumn}
          ></Column>
        </DataTable>
      </div>
    </>
  );
};

export default CategoryConfig;
