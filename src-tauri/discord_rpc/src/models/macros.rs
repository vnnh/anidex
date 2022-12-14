#[macro_export]
macro_rules! pub_struct {
    ($name:ident {$($field:ident: $t:ty,)*}) => {
        #[derive(Debug, PartialEq, Deserialize, Serialize)]
        pub struct $name {
            $(
                #[serde(skip_serializing_if = "Option::is_none")]
                pub $field: Option<$t>
            ),*
        }

        impl $name {
            pub fn new() -> Self {
                Self::default()
            }

            $(pub fn $field(mut self, value: $t) -> Self {
                self.$field = Some(value);
                self
            })*
        }

        impl Default for $name {
            fn default() -> Self {
                Self {
                    $($field: None),*
                }
            }
        }
    }
}
