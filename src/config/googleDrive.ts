// Google Drive folder configuration for BUBT Intake 51 Section 5
export const GOOGLE_DRIVE_FOLDERS = {
  // Main folder
  main: "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k-iugq",
  
  // Course folders with categories
  courses: {
    "CSE-319-20": {
      name: "Networking",
      folders: {
        notes: "https://drive.google.com/drive/folders/1l8g42421DxTx8Jynw1SvclSmULh_pRGB?usp=drive_link",
        suggestions: "https://drive.google.com/drive/folders/1TdqbUtNRNxecoa4UqSP_QiGfmDqtip85?usp=drive_link",
        "super-tips": "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k?usp=drive_link",
        slides: "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k?usp=drive_link",
        "ct-questions": "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k?usp=drive_link",
        videos: "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k?usp=drive_link"
      }
    },
    "CSE-327": {
      name: "Software Development", 
      folders: {
        notes: "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k?usp=drive_link",
        suggestions: "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k?usp=drive_link",
        "super-tips": "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k?usp=drive_link",
        slides: "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k?usp=drive_link",
        "ct-questions": "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k?usp=drive_link",
        videos: "https://drive.google.com/drive/folders/1HmjIBbTM8tIlHk7PUepTo7Cffjjg_4pz?usp=drive_link"
      }
    },
    "CSE-407": {
      name: "Project Management and Professional Ethics",
      folders: {
        notes: "https://drive.google.com/drive/folders/1ClwqZUviBzvD7nlwdgs7R_cqqE1LOyPB?usp=drive_link",
        suggestions: "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k?usp=drive_link",
        "super-tips": "https://drive.google.com/drive/folders/1tohR5z8mzww5_bdrHBSyw8f_TiT1lSxr?usp=drive_link",
        slides: "https://drive.google.com/drive/folders/1k-YbuQWjS55ILp6PlL2cFzzMuAgLcHBS?usp=drive_link",
        "ct-questions": "https://drive.google.com/drive/folders/1EFePyLfkpz5ZXCqltbCDRI89zdV1DS0-?usp=drive_link",
        videos: "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k?usp=drive_link"
      }
    },
    "CSE-417": {
      name: "Distributed Database",
      folders: {
        notes: "https://drive.google.com/drive/folders/1Cj7e5bMQ3EVZCM4PmVlWk_btEaRQEgOE?usp=drive_link",
        suggestions: "https://drive.google.com/drive/folders/1g8iylmTwsXjNu4avpuw0_ExCkFn7qvfO?usp=drive_link",
        "super-tips": "https://drive.google.com/drive/folders/1JyabWXGbc_n393IWJtkXzoXq497V5L8_?usp=drive_link",
        slides: "https://drive.google.com/drive/folders/1vaYBNaeKd_KSF_6IiL8zWvv6VPOVd0xn?usp=drive_link",
        "ct-questions": "https://drive.google.com/drive/folders/10tBeyp9jiCWonkAgp2V159_7YI5fU6iR?usp=drive_link",
        videos: "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k?usp=drive_link"
      }
    },
    "CSE-351": {
      name: "Artificial Intelligence",
      folders: {
        notes: "https://drive.google.com/drive/folders/1uU1LJezyERa8G0gcP2hrAC-o7NFeQay2?usp=drive_link",
        suggestions: "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k?usp=drive_link",
        "super-tips": "https://drive.google.com/drive/folders/1X-7QorIEnEfJzqX-4D1dfZ0ZFCxZBhSk?usp=drive_link",
        slides: "https://drive.google.com/drive/folders/1JA0sX1kh7aBC9BoyAAKdMBNvuP4O_Sto?usp=drive_link",
        "ct-questions": "https://drive.google.com/drive/folders/1grVVQy9XeGWxomTjO-n2JKZHFRofzJtj?usp=drive_link",
        videos: "https://drive.google.com/drive/folders/bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k?usp=drive_link"
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

// Helper function to get category display info
export const getCategoryInfo = (category: string) => {
  const categoryMap: Record<string, { icon: string; label: string; color: string }> = {
    'notes': { icon: '📝', label: 'Notes', color: 'blue' },
    'suggestions': { icon: '💡', label: 'Suggestions', color: 'yellow' },
    'super-tips': { icon: '⚡', label: 'Super Tips (One Night Before Exam)', color: 'purple' },
    'slides': { icon: '📊', label: 'Slides', color: 'green' },
    'ct-questions': { icon: '❓', label: 'CT Questions', color: 'red' },
    'videos': { icon: '🎥', label: 'Videos', color: 'pink' }
  };
  return categoryMap[category] || { icon: '📄', label: category, color: 'gray' };
};