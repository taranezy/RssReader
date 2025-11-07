# This is a configuration file for ProGuard.# Add project specific ProGuard rules here.

# You can control the set of applied configuration files using the

# Specify the input and output jars, library jars, keep directives, etc.# proguardFiles setting in build.gradle.



# Preserve line numbers for debugging stack traces# Keep data classes and entities

-keepattributes SourceFile,LineNumberTable-keep class com.rssreader.app.data.model.** { *; }

-renamesourcefileattribute SourceFile-keep class com.rssreader.app.data.entity.** { *; }



# Keep Retrofit interfaces# Keep Room

-keep interface com.rssreader.app.data.remote.RssReaderApi { *; }-keep class * extends androidx.room.RoomDatabase

-keep @androidx.room.Entity class *

# Keep model classes-dontwarn androidx.room.paging.**

-keep class com.rssreader.app.data.model.** { *; }

# Keep Retrofit

# Keep Gson-related classes-keepattributes Signature

-keepclassmembers enum java.lang.Enum {-keepattributes *Annotation*

    public static **[] values();-keep class retrofit2.** { *; }

    public static ** valueOf(java.lang.String);-keepclasseswithmembers class * {

}    @retrofit2.http.* <methods>;

}

# Keep Serializable classes

-keepclassmembers class * implements java.io.Serializable {# Keep OkHttp

    static final long serialVersionUID;-dontwarn okhttp3.**

    private static final java.io.ObjectStreamField[] serialPersistentFields;-dontwarn okio.**

    private void writeObject(java.io.ObjectOutputStream);-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase

    private void readObject(java.io.ObjectInputStream);

    java.lang.Object writeReplace();# Keep Gson

    java.lang.Object readResolve();-keepattributes Signature

}-keepattributes *Annotation*

-dontwarn sun.misc.**
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapter
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# Keep Glide
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep class * extends com.bumptech.glide.module.AppGlideModule {
 <init>(...);
}
-keep public enum com.bumptech.glide.load.ImageHeaderParser$** {
  **[] $VALUES;
  public *;
}

# Keep Kotlin Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepclassmembers class kotlinx.coroutines.** {
    volatile <fields>;
}

# Remove logging in release
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
