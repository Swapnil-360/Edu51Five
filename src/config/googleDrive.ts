// Google Drive folder configuration for BUBT Intake 51 Section 5
export const GOOGLE_DRIVE_FOLDERS = {
  // Main folder
  main: "https://drive.google.com/drive/folders/1HmjIBbTM8tIlHk7PUepTo7Cffjjg_4pz?usp=drive_link",
  
  // Course folders with categories
  courses: {
    "CSE-319-20": {
      name: "Networking",
      folders: {
        "ct-questions": "https://drive.google.com/drive/folders/19GNZOjHkeI74NeU6wQ4Ud_k6p5082muo?usp=drive_link",
        notes: "https://drive.google.com/drive/folders/15P_lHxnMKHeUNQlGd2s-3_U3p9a6Tptt?usp=drive_link",
        slides: "https://drive.google.com/drive/folders/1V-G1KJbKeMi6ipkWeRZik13ZXI6WcMuT?usp=drive_link",
        suggestions: "https://drive.google.com/drive/folders/1NrwJsqGJvVBxDOPJBSXse2m00ajMhbo6?usp=drive_link",
        "super-tips": "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k?usp=drive_link",
        videos: "https://drive.google.com/drive/folders/1LaHnIMxu0X4klUqBAjYajpaWGX7vNvw8?usp=drive_link"
      }
    },
    "CSE-327": {
      name: "Software Development", 
      folders: {
        "ct-questions": "https://drive.google.com/drive/folders/1TnHTiq8jVf7K0aqoOvhBQzxgW-Zt-A1b?usp=drive_link",
        notes: "https://drive.google.com/drive/folders/1lHY1VHo-2BpvEgRVuBt2UkR7ye05XJoU?usp=drive_link",
        slides: "https://drive.google.com/drive/folders/16I2ET_APiduX79Xm9Z-d_UH0PZ5LsMLv?usp=drive_link",
        suggestions: "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k?usp=drive_link",
        "super-tips": "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k-?usp=drive_link",
        videos: "https://drive.google.com/drive/folders/1lIDc5yFLV53o-yJUcxLyoT8yTr1gFoVH?usp=drive_link"
      }
    },
    "CSE-407": {
      name: "Project Management and Professional Ethics",
      folders: {
        "ct-questions": "https://drive.google.com/drive/folders/1aeiZL_IvhavB-zKVH_AYz881Kir-zxpA?usp=drive_link",
        notes: "https://drive.google.com/drive/folders/1vUyDqOle6a0XySBitkrFYKJIHzDC-nsS?usp=drive_link",
        slides: "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k?usp=drive_link",
        suggestions: "https://drive.google.com/drive/folders/1KCy4SgMBMxwVOBotwPxID7MFUpt9_Ow4?usp=drive_link",
        "super-tips": "https://drive.google.com/drive/folders/1rEimFkWrpEGYWEbfh3JN-Nrb6eMn5km2?usp=drive_link",
        videos: "https://drive.google.com/drive/folders/1xTBB9NxRnllI-Fm_vzmo8peVklF-bEbp?usp=drive_link"
      }
    },
    "CSE-417": {
      name: "Distributed Database",
      folders: {
        "ct-questions": "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k?usp=drive_link",
        notes: "https://drive.google.com/drive/folders/1hjTWNQd2HRV692i5g4nd_W-4T3FOE_cy?usp=drive_link",
        slides: "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k?usp=drive_link",
        suggestions: "https://drive.google.com/drive/folders/1qoYuJ2xiuCty3LqEyTXG-7BlryXycN_t?usp=drive_link",
        "super-tips": "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k?usp=drive_link",
        videos: "https://drive.google.com/drive/folders/1xkDwJDx1wZHW7JOsk6--89kuzGBJyWli?usp=drive_link"
      }
    },
    "CSE-351": {
      name: "Artificial Intelligence",
      folders: {
        "ct-questions": "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k-i?usp=drive_link",
        notes: "https://drive.google.com/drive/folders/1emxoxmzIkH2jJtFORhO58NE-_F78347V?usp=drive_link",
        slides: "https://drive.google.com/drive/folders/1Hi2fiSozLjmHqdenHEYnEqJM_ruOylRT?usp=drive_link",
        suggestions: "https://drive.google.com/drive/folders/1LieLecfrAYqzNB5OSQ6RrE0LC1Anbmxd?usp=drive_link",
        "super-tips": "https://drive.google.com/drive/folders/1dAxtUgEkaTMJjEjnY9616eRN-Gp1HkFC?usp=drive_link",
        videos: "https://drive.google.com/drive/folders/12wWh4Hm-4hCVlRZ-8F3Ioku6ySeTkkPB?usp=drive_link"
      }
    }
  }
};

// Helper function to get folder link for a course and category
export const getGoogleDriveLink = (courseCode: string, category: string) => {
  const course = GOOGLE_DRIVE_FOLDERS.courses[courseCode as keyof typeof GOOGLE_DRIVE_FOLDERS.courses];
  if (!course) return GOOGLE_DRIVE_FOLDERS.main;
  
  const folderLink = course.folders[category as keyof typeof course.folders];
  return folderLink || GOOGLE_DRIVE_FOLDERS.main;
};

// Helper function to get all categories for a course
export const getCourseCategories = (courseCode: string) => {
  const course = GOOGLE_DRIVE_FOLDERS.courses[courseCode as keyof typeof GOOGLE_DRIVE_FOLDERS.courses];
  return course ? Object.keys(course.folders) : [];
};

// Helper function to get category display info with sophisticated professional colors
export const getCategoryInfo = (category: string) => {
  const categoryMap: Record<string, { icon: string; label: string; color: string; bgGradient: string; textColor: string; borderColor: string; iconBg: string }> = {
    'notes': { 
      icon: '📝', 
      label: 'Notes', 
      color: 'blue',
      bgGradient: 'from-slate-50 to-blue-50',
      textColor: 'text-slate-700',
      borderColor: 'border-slate-200',
      iconBg: 'bg-blue-100'
    },
    'suggestions': { 
      icon: '💡', 
      label: 'Suggestions', 
      color: 'yellow',
      bgGradient: 'from-amber-50 to-orange-50',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-200',
      iconBg: 'bg-amber-100'
    },
    'super-tips': { 
      icon: '⚡', 
      label: 'Super Tips (One Night Before Exam)', 
      color: 'purple',
      bgGradient: 'from-violet-50 to-purple-50',
      textColor: 'text-violet-800',
      borderColor: 'border-violet-200',
      iconBg: 'bg-violet-100'
    },
    'slides': { 
      icon: '📊', 
      label: 'Slides', 
      color: 'green',
      bgGradient: 'from-emerald-50 to-teal-50',
      textColor: 'text-emerald-800',
      borderColor: 'border-emerald-200',
      iconBg: 'bg-emerald-100'
    },
    'ct-questions': { 
      icon: '❓', 
      label: 'CT Questions', 
      color: 'red',
      bgGradient: 'from-red-50 to-rose-50',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
      iconBg: 'bg-red-100'
    },
    'videos': { 
      icon: '🎥', 
      label: 'Videos', 
      color: 'pink',
      bgGradient: 'from-pink-50 to-rose-50',
      textColor: 'text-pink-800',
      borderColor: 'border-pink-200',
      iconBg: 'bg-pink-100'
    }
  };
  return categoryMap[category] || { 
    icon: '📄', 
    label: category, 
    color: 'gray',
    bgGradient: 'from-gray-50 to-slate-50',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200',
    iconBg: 'bg-gray-100'
  };
};

// Real file structure for each course and category
// This will contain actual file counts and embed URLs for preview
export const getCourseFiles = (courseCode: string, category: string) => {
  // Real file data - you'll provide the actual embed URLs for each file
  const courseFiles: Record<string, Record<string, Array<{id: string, name: string, url: string, embedUrl?: string}>>> = {
    "CSE-319-20": {
      "ct-questions": [
        { id: "cse319_ct1", name: "CT-1 Questions.pdf", url: "https://drive.google.com/file/d/1J5LbhRyjw-x556TYXHHj7nSuhNqs8bdU/view", embedUrl: "https://drive.google.com/file/d/1J5LbhRyjw-x556TYXHHj7nSuhNqs8bdU/preview" },
        { id: "cse319_ct2", name: "CT-2 Questions.pdf", url: "https://drive.google.com/file/d/1IJL8zc9FrnR-oqLDeyLoXxJiPKHTVd6E/view", embedUrl: "https://drive.google.com/file/d/1IJL8zc9FrnR-oqLDeyLoXxJiPKHTVd6E/preview" },
        { id: "cse319_ct3", name: "CT-3 Questions.pdf", url: "https://drive.google.com/file/d/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k/view", embedUrl: "https://drive.google.com/file/d/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k/preview" },
        { id: "cse319_ct4", name: "Mid Term Questions.pdf", url: "https://drive.google.com/file/d/1Oe49gq40VS790n-EtY2pDbDaN3UvCM8-/view", embedUrl: "https://drive.google.com/file/d/1Oe49gq40VS790n-EtY2pDbDaN3UvCM8-/preview" },
        // More files available in the drive folder - will be updated when uploaded
      ],
      "notes": [
        { id: "cse319_notes1", name: "Network Fundamentals.pdf", url: "https://drive.google.com/file/d/14lAjrV_otmPTJQM4DMfP7TUS5bk3uWMU/view", embedUrl: "https://drive.google.com/file/d/14lAjrV_otmPTJQM4DMfP7TUS5bk3uWMU/preview" },
        { id: "cse319_notes2", name: "OSI Model.pdf", url: "https://drive.google.com/file/d/10-xNi7tA9HVVHm6IvWKYIseDZsjZDAat/view", embedUrl: "https://drive.google.com/file/d/10-xNi7tA9HVVHm6IvWKYIseDZsjZDAat/preview" },
        // More files available in the drive folder - will be updated when uploaded
      ],
      "slides": [
        // Files will be updated later when uploaded to Google Drive
      ],
      "suggestions": [
        // Files will be updated later when uploaded to Google Drive
      ],
      "super-tips": [
        // Files will be updated later when uploaded to Google Drive
      ],
      "videos": [
        // Files will be updated later when uploaded to Google Drive
      ]
    },
    "CSE-327": {
      "ct-questions": [
        { id: "cse327_ct1", name: "CT-1 Questions.pdf", url: "https://drive.google.com/file/d/1_kyCBC_n2nPdCXC2JrWtoPxtgXvCx6Q-/view", embedUrl: "https://drive.google.com/file/d/1_kyCBC_n2nPdCXC2JrWtoPxtgXvCx6Q-/preview" },
        { id: "cse327_ct2", name: "CT-2 Questions.pdf", url: "https://drive.google.com/file/d/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k/view", embedUrl: "https://drive.google.com/file/d/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k/preview" },
        { id: "cse327_ct3", name: "CT-3 Questions.pdf", url: "https://drive.google.com/file/d/14R0je8S2BzWEi_Rrnp0nNP-0w7u204Ho/view", embedUrl: "https://drive.google.com/file/d/14R0je8S2BzWEi_Rrnp0nNP-0w7u204Ho/preview" },
        // More files available in the drive folder - will be updated when uploaded
      ],
      "notes": [
        { id: "cse327_notes1", name: "Software Development Notes 1.pdf", url: "https://drive.google.com/file/d/1XboKCrT6zBZgw6sNr-4oQP1iYOI4c6Gi/view", embedUrl: "https://drive.google.com/file/d/1XboKCrT6zBZgw6sNr-4oQP1iYOI4c6Gi/preview" },
        { id: "cse327_notes2", name: "Software Development Notes 2.pdf", url: "https://drive.google.com/file/d/1OB8deUuNorK-_gjlB2kgoScOZFy4yw3D/view", embedUrl: "https://drive.google.com/file/d/1OB8deUuNorK-_gjlB2kgoScOZFy4yw3D/preview" },
        // More files available in the drive folder - will be updated when uploaded
      ],
      "slides": [
        // Files will be updated later when uploaded to Google Drive
      ],
      "suggestions": [
        { id: "cse327_suggest1", name: "Study Suggestions 1.pdf", url: "https://drive.google.com/file/d/1bIs_xO91lOLj_CSnBj3GnvHREuE0cs91/view", embedUrl: "https://drive.google.com/file/d/1bIs_xO91lOLj_CSnBj3GnvHREuE0cs91/preview" },
        { id: "cse327_suggest2", name: "Study Suggestions 2.pdf", url: "https://drive.google.com/file/d/1Z8NmtQAfnZb-f-TZFzQjx6JTaypfkqsO/view", embedUrl: "https://drive.google.com/file/d/1Z8NmtQAfnZb-f-TZFzQjx6JTaypfkqsO/preview" },
        // More files available in the drive folder - will be updated when uploaded
      ],
      "super-tips": [
        // Files will be updated later when uploaded to Google Drive
      ],
      "videos": [
        // Files will be updated later when uploaded to Google Drive
      ]
    },
    "CSE-351": {
      "ct-questions": [
        // Files will be updated later when uploaded to Google Drive - no files available yet
      ],
      "notes": [
        // Files will be updated later when uploaded to Google Drive - no files available yet
      ],
      "slides": [
        // Files will be updated later when uploaded to Google Drive - no files available yet
      ],
      "suggestions": [
        // Files will be updated later when uploaded to Google Drive - no files available yet
      ],
      "super-tips": [
        // Files will be updated later when uploaded to Google Drive - no files available yet
      ],
      "videos": [
        // Files will be updated later when uploaded to Google Drive - no files available yet
      ]
    },
    "CSE-407": {
      "ct-questions": [
        { id: "cse407_ct1", name: "CSE-407 CT Question 1.pdf", url: "https://drive.google.com/file/d/1IWKcqUTeOE3t0-eqMApTX10-BpS9Nucm/view", embedUrl: "https://drive.google.com/file/d/1IWKcqUTeOE3t0-eqMApTX10-BpS9Nucm/preview" },
        { id: "cse407_ct2", name: "CSE-407 CT Question 2.pdf", url: "https://drive.google.com/file/d/1-EfT-cRMsfN3PRQ3YfreBNffPFlLcCkg/view", embedUrl: "https://drive.google.com/file/d/1-EfT-cRMsfN3PRQ3YfreBNffPFlLcCkg/preview" },
        { id: "cse407_ct3", name: "CSE-407 CT Question 3.pdf", url: "https://drive.google.com/file/d/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k/view", embedUrl: "https://drive.google.com/file/d/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k/preview" },
      ],
      "notes": [
        { id: "cse407_notes1", name: "CSE-407 by Intake-49.pdf", url: "https://drive.google.com/file/d/1kX3PLSVju_sxIOifprP-miybjVkTYE0p/view", embedUrl: "https://drive.google.com/file/d/1kX3PLSVju_sxIOifprP-miybjVkTYE0p/preview" },
        { id: "cse407_notes2", name: "Mid Note for CSE-407.pdf", url: "https://drive.google.com/file/d/1YnT7upyRTH9UbZi_QpiAB3EcUA9Ra70s/view", embedUrl: "https://drive.google.com/file/d/1YnT7upyRTH9UbZi_QpiAB3EcUA9Ra70s/preview" },
        { id: "cse407_notes3", name: "Chapter 1 - Introduction to Project Management.pdf", url: "https://drive.google.com/file/d/18zvvs3UCIH__-eEZoeSmcr1CtkkHEzmN/view", embedUrl: "https://drive.google.com/file/d/18zvvs3UCIH__-eEZoeSmcr1CtkkHEzmN/preview" },
        // More files available in the drive folder - will be updated when uploaded
      ],
      "slides": [
        { id: "cse407_slide1", name: "Project Management Slides 1.pdf", url: "https://drive.google.com/file/d/1gp3l5KNjzuZS_vC0LUMQ2omWV4Evdbkl/view", embedUrl: "https://drive.google.com/file/d/1gp3l5KNjzuZS_vC0LUMQ2omWV4Evdbkl/preview" },
        { id: "cse407_slide2", name: "Project Management Slides 2.pdf", url: "https://drive.google.com/file/d/1Tif_siXwLyDEmo_jEqUbt5TjQ9bCvywH/view", embedUrl: "https://drive.google.com/file/d/1Tif_siXwLyDEmo_jEqUbt5TjQ9bCvywH/preview" },
        { id: "cse407_slide3", name: "Project Management Slides 3.pdf", url: "https://drive.google.com/file/d/1E_JtTEB5TxBw6CVPlcRDWTUs06tONAlJ/view", embedUrl: "https://drive.google.com/file/d/1E_JtTEB5TxBw6CVPlcRDWTUs06tONAlJ/preview" },
        // More files available in the drive folder - will be updated when uploaded
      ],
      "suggestions": [
        { id: "cse407_suggest1", name: "Study Suggestions 1.pdf", url: "https://drive.google.com/file/d/1E4vx7FMTmIL0_W76HWXU4aiI16e5m_K4/view", embedUrl: "https://drive.google.com/file/d/1E4vx7FMTmIL0_W76HWXU4aiI16e5m_K4/preview" },
        { id: "cse407_suggest2", name: "Study Suggestions 2.pdf", url: "https://drive.google.com/file/d/1eA9zsj9s7xkNzS5Qs-I-lg8LPsqHdLEF/view", embedUrl: "https://drive.google.com/file/d/1eA9zsj9s7xkNzS5Qs-I-lg8LPsqHdLEF/preview" },
        // More files available in the drive folder - will be updated when uploaded
      ],
      "super-tips": [
        // Files will be updated later when uploaded to Google Drive
      ],
      "videos": [
        // Files will be updated later when uploaded to Google Drive
      ]
    },
    "CSE-417": {
      "ct-questions": [
        // Files will be updated later when uploaded to Google Drive - no files available yet
      ],
      "notes": [
        // Files will be updated later when uploaded to Google Drive - no files available yet
      ],
      "slides": [
        // Files will be updated later when uploaded to Google Drive - no files available yet
      ],
      "suggestions": [
        // Files will be updated later when uploaded to Google Drive - no files available yet
      ],
      "super-tips": [
        // Files will be updated later when uploaded to Google Drive - no files available yet
      ],
      "videos": [
        // Files will be updated later when uploaded to Google Drive - no files available yet
      ]
    }
  };

  const course = courseFiles[courseCode];
  if (!course) return [];
  
  const files = course[category];
  return files || [];
};