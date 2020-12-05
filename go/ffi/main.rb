require 'fiddle/import'

module M
  extend Fiddle::Importer
  dlload "lib.so"
  extern "int Hoge()"
  extern 'char* Fuga()'
  extern 'String* Piyo()'
  extern 'void Bar(*char in)'
  extern 'void Free(*char in)'
end

p M.Hoge()
str = M.Fuga()
p str.to_s
M.Free(str)

str = M.Piyo()
p str.to_s
M.Free(str)

M.Bar('bar')
