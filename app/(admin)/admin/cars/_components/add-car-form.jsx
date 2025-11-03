"use client";

import React, { useEffect, useState } from "react";
import { addCar, processCarImageWithAI } from "@/actions/cars";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import Image from "next/image";
import { Camera, Loader2, Upload, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import { useRouter } from "next/navigation";

const fuelTypes = ["Petrol", "Diesel", "Electric", "Hybrid", "Plug-in Hybrid"];
const transmissionTypes = ["Automatic", "Manual", "Semi-Automatic"];
const bodyTypes = [
  "Sedan",
  "SUV",
  "Hatchback",
  "Coupe",
  "Convertible",
  "Wagon",
  "Van",
  "Pickup",
];
const carStatuses = ["AVAILABLE", "SOLD", "UNAVAILABLE"];

const AddCarForm = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("ai");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageError, setImageError] = useState("");
  const [uploadedAiImage, setUploadedAiImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const carFormSchema = z.object({
    make: z.string().min(1, "Make is required"),
    model: z.string().min(1, "Model is required"),
    year: z.string().refine((val) => {
      const year = parseInt(val, 10);
      return (
        !isNaN(year) && year >= 1990 && year <= new Date().getFullYear() + 1
      );
    }, "Year must be 1990 or later"),
    price: z.string().min(1, "Price is required"),
    mileage: z.string().min(1, "Mileage is required"),
    color: z.string().optional(),
    fuelType: z.string().min(1, "Fuel type is required"),
    transmission: z.string().min(1, "Transmission type is required"),
    bodyType: z.string().min(1, "Body type is required"),
    seats: z.string().optional(),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    status: z.enum(["AVAILABLE", "SOLD", "UNAVAILABLE"]),
    featured: z.boolean().default(false),
  });

  const {
    register,
    setValue,
    formState: { errors },
    handleSubmit,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      make: "",
      model: "",
      year: "",
      price: "",
      mileage: "",
      color: "",
      fuelType: "",
      transmission: "",
      bodyType: "",
      seats: "",
      description: "",
      status: "AVAILABLE",
      featured: false,
    },
  });

  const onAiDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setUploadedAiImage(file);

      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
        toast.success("Image uploaded successfully");
      };

      reader.readAsDataURL(file);
    }
  };

  const { getRootProps: getAiRootProps, getInputProps: getAiInputProps } =
    useDropzone({
      onDrop: onAiDrop,
      accept: {
        "image/*": [".jpeg", ".jpg", ".png", ".webp"],
      },
      maxFiles: 1,
      multiple: false,
    });

  // Fetch hook for adding car
  const {
    loading: processImageLoading,
    fn: processImageFn,
    data: processImageResult,
    error: processImageError,
  } = useFetch(processCarImageWithAI);

  const processWithAi = async () => {
    if (!uploadedAiImage) {
      toast.error("Please upload an image first");
      return;
    }
    await processImageFn(uploadedAiImage);
  };

  useEffect(() => {
    if (processImageError) {
      toast.error("Failed to process image");
    }
  }, [processImageError]);

  useEffect(() => {
    if (processImageResult?.success && processImageResult?.data) {
      const carDetails = processImageResult.data; // Fixed: removed .carDetails
      console.log("AI Extracted Details:", carDetails);
      
      // Populate form fields with AI extracted data
      setValue("make", carDetails.make || "");
      setValue("model", carDetails.model || "");
      setValue("year", carDetails.year?.toString() || "");
      setValue("price", carDetails.price?.toString() || "");
      setValue("mileage", carDetails.mileage?.toString() || "");
      setValue("color", carDetails.color || "");
      setValue("fuelType", carDetails.fuelType || "");
      setValue("transmission", carDetails.transmission || "");
      setValue("bodyType", carDetails.bodyType || "");
      setValue("seats", carDetails.seats?.toString() || "");
      setValue("description", carDetails.description || "");

      if (uploadedAiImage) {
        const reader = new FileReader();
        reader.onload = () => {
          setUploadedImages((prev) => [...prev, reader.result]);
        };
        reader.readAsDataURL(uploadedAiImage);
      }

      toast.success("Car details extracted successfully!", {
        description: `Detected ${carDetails.make} ${carDetails.model} (${carDetails.year}) with ${Math.round((carDetails.confidence || 0) * 100)}% confidence.`,
      });

      setActiveTab("manual"); // Switch to manual tab after processing
    }
  }, [processImageResult, uploadedAiImage, setValue]);

  const {
    data: addCarResult,
    loading: addCarLoading,
    fn: addCarfn,
  } = useFetch(addCar);

  useEffect(() => {
    if (addCarResult) {
      toast.success("Car added successfully!");
      reset();
      setUploadedImages([]);
      router.push("/admin/cars");
    }
  }, [addCarResult, router, reset]);

  const onSubmit = async (data) => {
    try {
      console.log("Raw form data:", data);

      if (uploadedImages.length === 0) {
        setImageError("Please upload at least one image");
        return;
      }

      const carData = {
        make: data.make,
        model: data.model,
        year: parseInt(data.year),
        price: parseFloat(data.price),
        mileage: parseFloat(data.mileage),
        color: data.color || "",
        fuelType: data.fuelType,
        transmission: data.transmission,
        bodyType: data.bodyType,
        seats: data.seats ? parseInt(data.seats) : null,
        description: data.description,
        status: data.status,
        featured: data.featured || false,
      };

      console.log("Processed car data:", carData);
      console.log("Images to upload:", uploadedImages);

      await addCarfn({ carData, images: uploadedImages });
      setImageError("");

      console.log("Form submitted successfully!");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to add car. Please try again.");
    }
  };

  const onMultiImageDrop = (acceptedFiles) => {
    const validFiles = acceptedFiles.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newImages = [];

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newImages.push(reader.result);

        if (newImages.length === validFiles.length) {
          setUploadedImages((prev) => [...prev, ...newImages]);
          setImageError("");
          toast.success(`Successfully uploaded ${validFiles.length} image(s)`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const {
    getRootProps: getMultiImageRootProps,
    getInputProps: getMultiImageInputProps,
  } = useDropzone({
    onDrop: onMultiImageDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: true,
  });

  const removeImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <Tabs defaultValue="manual" className="mt-6" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="ai">AI Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Car details</CardTitle>
              <CardDescription>
                Enter the details of the car you want to add.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="make"> Make</Label>
                    <Input
                      type="text"
                      id="make"
                      {...register("make")}
                      placeholder="e.g. Toyota"
                      className={errors.make ? "border-red-500" : ""}
                    />
                    {errors.make && (
                      <p className="text-red-500">{errors.make.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model"> Model</Label>
                    <Input
                      type="text"
                      id="model"
                      {...register("model")}
                      placeholder="e.g. Corolla"
                      className={errors.model ? "border-red-500" : ""}
                    />
                    {errors.model && (
                      <p className="text-red-500">{errors.model.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year"> Year</Label>
                    <Input
                      type="text"
                      id="year"
                      {...register("year")}
                      placeholder="e.g. 2020"
                      className={errors.year ? "border-red-500" : ""}
                    />
                    {errors.year && (
                      <p className="text-red-500">{errors.year.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price"> Price (LKR)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        Rs
                      </span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        id="price"
                        {...register("price")}
                        placeholder="2000000"
                        className={`pl-10 ${errors.price ? "border-red-500" : ""}`}
                        autoComplete="off"
                      />
                    </div>
                    {errors.price && (
                      <p className="text-red-500">{errors.price.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mileage"> Mileage</Label>
                    <Input
                      type="text"
                      id="mileage"
                      {...register("mileage")}
                      placeholder="e.g. 50000"
                      className={errors.mileage ? "border-red-500" : ""}
                    />
                    {errors.mileage && (
                      <p className="text-red-500">{errors.mileage.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color"> Colour</Label>
                    <Input
                      type="text"
                      id="color"
                      {...register("color")}
                      placeholder="e.g. Blue"
                      className={errors.color ? "border-red-500" : ""}
                    />
                    {errors.color && (
                      <p className="text-red-500">{errors.color.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fuelType"> Fuel Type</Label>
                    <Select
                      onValueChange={(value) => setValue("fuelType", value)}
                      value={watch("fuelType")}
                    >
                      <SelectTrigger
                        className={errors.fuelType ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Select Fuel Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {fuelTypes.map((type) => {
                          return (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {errors.fuelType && (
                      <p className="text-red-500">{errors.fuelType.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transmission"> Transmission</Label>
                    <Select
                      onValueChange={(value) => setValue("transmission", value)}
                      value={watch("transmission")}
                    >
                      <SelectTrigger
                        className={errors.transmission ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Select Transmission" />
                      </SelectTrigger>
                      <SelectContent>
                        {transmissionTypes.map((type) => {
                          return (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {errors.transmission && (
                      <p className="text-red-500">
                        {errors.transmission.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bodyType"> Body Type</Label>
                    <Select
                      onValueChange={(value) => setValue("bodyType", value)}
                      value={watch("bodyType")}
                    >
                      <SelectTrigger
                        className={errors.bodyType ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Select Body Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {bodyTypes.map((type) => {
                          return (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {errors.bodyType && (
                      <p className="text-red-500">{errors.bodyType.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seats">
                      Number of Seats{""}
                      <span className="text-xs text-gray-500">(optional)</span>
                    </Label>
                    <Input
                      type="text"
                      id="seats"
                      {...register("seats")}
                      placeholder="e.g. 5"
                    />
                    {errors.seats && (
                      <p className="text-red-500">{errors.seats.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status"> Status</Label>
                    <Select
                      onValueChange={(value) => setValue("status", value)}
                      defaultValue="AVAILABLE"
                    >
                      <SelectTrigger
                        className={errors.status ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {carStatuses.map((status) => {
                          return (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0) + status.slice(1).toLowerCase()}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {errors.status && (
                      <p className="text-red-500">{errors.status.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    className={`min-h-32 ${
                      errors.description ? "border-red-500" : ""
                    }`}
                    placeholder="Enter a brief description of the car"
                  />
                  {errors.description && (
                    <p className="text-red-500 text-xs">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="flex items-start space-x-3 rounded-md border p-4">
                  <Checkbox
                    id="featured"
                    checked={watch("featured")}
                    onCheckedChange={(checked) => setValue("featured", checked)}
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="featured">Feature this car</Label>
                    <p className="text-sm text-gray-500">
                      Featured cars appear on the homepage
                    </p>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label className={imageError ? "text-red-500" : ""}>
                    Images
                  </Label>
                  <div
                    {...getMultiImageRootProps()}
                    className={`flex items-center justify-center border-2 border-dashed border-gray-300 p-6 rounded-md cursor-pointer hover:bg-gray-50 transition mt-2  ${
                      imageError ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <input {...getMultiImageInputProps()} />
                    <div className="text-center text-gray-500 justify-center items-center flex-col flex">
                      <Upload className="mx-auto mb-2 h-12 w-12 " />
                      <p>Drag and drop images here, or click to select files</p>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG, Webp, max 5MB each
                      </p>
                    </div>
                  </div>
                  {imageError && (
                    <p className="text-red-500 text-sm">{imageError}</p>
                  )}

                  {uploadedImages.length > 0 && (
                    <div className="mt-4 ">
                      <h3 className="text-sm font-medium mb-2">
                        Uploaded Images ({uploadedImages.length})
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 sm:grid-cols-3 gap-4 lg:grid-cols-5">
                        {uploadedImages.map((image, index) => {
                          return (
                            <div key={index} className="relative group">
                              <Image
                                src={image}
                                alt={`Car image ${index + 1}`}
                                height={50}
                                width={50}
                                className="w-full h-28 object-cover rounded-md"
                                priority
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full md:w-auto"
                  disabled={addCarLoading}
                >
                  {addCarLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding Car...
                    </>
                  ) : (
                    "Add Car"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Car Details Extraction</CardTitle>
              <CardDescription>
                Upload images and let AI extract car details automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {imagePreview ? (
                  <div>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Image
                        src={imagePreview}
                        alt="Uploaded car image"
                        width={300}
                        height={200}
                        className="max-h-56 w-full object-contain mb-4"
                      />
                    </div>
                    <div className="flex gap-4 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setImagePreview(null);
                          setUploadedAiImage(null);
                          toast.info("Image removed");
                        }}
                      >
                        Remove
                      </Button>
                      <Button
                        size="sm"
                        onClick={processWithAi}
                        disabled={processImageLoading}
                      >
                        {processImageLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing....
                          </>
                        ) : (
                          <>
                            <Camera className="mr-2 h-4 w-4" />
                            Extract Details
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    {...getAiRootProps()}
                    className="cursor-pointer bg-gray-50 transition border-2 border-dashed border-gray-300 p-6 rounded-md"
                  >
                    <input {...getAiInputProps()} />
                    <div className="flex flex-col items-center justify-center">
                      <Camera className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-gray-600 text-sm">
                        Drag & drop a car image or click to select
                      </p>

                      <p className="text-gray-500 text-xs">
                        Supports: JPG, PNG, Webp (max 5MB)
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium mb-2">How it works</h3>
                  <ol className="space-y-2 text-sm text-gray-600 list-decimal pl-5">
                    <li>Upload a clear image of the car</li>
                    <li>Click "Extract Details" to analyze with Gemini AI</li>
                    <li>Review the extracted information</li>
                    <li>Fill in any missing details manually</li>
                    <li>Add the car to your inventory</li>
                  </ol>
                </div>

                <div className="bg-amber-50 p-4 rounded-md mt-6">
                  <h3 className="font-medium mb-2">Important Notes</h3>
                  <ul className="space-y-2 text-sm text-gray-600 list-disc pl-5">
                    <li>
                      Ensure the image is clear and well-lit for best results.
                    </li>
                    <li>
                      AI may not extract all details accurately; manual review
                      is recommended.
                    </li>
                    <li>
                      You can still add images manually after AI extraction.
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddCarForm;